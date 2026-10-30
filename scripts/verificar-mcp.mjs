#!/usr/bin/env node
/**
 * Prueba de humo de los servidores MCP del proyecto.
 *
 * Arranca cada servidor por stdio, hace el handshake y lista sus herramientas.
 * Detecta en segundos que CodeGraph y Engram siguen funcionando tras cambiar de
 * versión o reinstalar, sin abrir el agente.
 *
 * Uso:
 *   node scripts/verificar-mcp.mjs            # resumen (recomendado)
 *   node scripts/verificar-mcp.mjs --verbose  # lista todas las herramientas
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..');
const VERBOSE = process.argv.includes('--verbose');

const SERVIDORES = [
  { nombre: 'codegraph', args: ['scripts/mcp-codegraph.mjs'] },
  { nombre: 'engram', args: ['scripts/mcp-engram.mjs'] },
];

/** Envía el handshake y devuelve los nombres de las herramientas. */
function probar({ nombre, args }) {
  return new Promise((resolvePromise) => {
    const hijo = spawn(process.execPath, args, {
      cwd: RAIZ,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let buffer = '';
    let terminado = false;

    const cerrar = (ok, detalle, herramientas = []) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(temporizador);
      hijo.kill();
      resolvePromise({ nombre, ok, detalle, herramientas });
    };

    const temporizador = setTimeout(() => cerrar(false, 'tiempo de espera agotado'), 60000);

    hijo.stdout.on('data', (trozo) => {
      buffer += trozo.toString('utf8');
      const lineas = buffer.split('\n');
      buffer = lineas.pop() ?? '';
      for (const linea of lineas) {
        if (!linea.trim().startsWith('{')) continue;
        let mensaje;
        try {
          mensaje = JSON.parse(linea);
        } catch {
          continue;
        }
        if (mensaje.id === 1 && mensaje.result) {
          hijo.stdin.write(
            JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n',
          );
          hijo.stdin.write(
            JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) + '\n',
          );
        }
        if (mensaje.id === 2) {
          if (Array.isArray(mensaje.result?.tools)) {
            const herramientas = mensaje.result.tools.map((t) => t.name);
            const bytes = Buffer.byteLength(JSON.stringify(mensaje.result.tools), 'utf8');
            const kb = (bytes / 1024).toFixed(1);
            cerrar(true, `${herramientas.length} herramientas · ${kb} KB de esquema`, herramientas);
          } else {
            cerrar(false, JSON.stringify(mensaje.error ?? mensaje).slice(0, 300));
          }
        }
      }
    });

    hijo.stderr.on('data', (trozo) => {
      const texto = trozo.toString('utf8').trim();
      if (texto && /panic|fatal/i.test(texto)) {
        cerrar(false, texto.slice(0, 300));
      }
    });

    hijo.on('exit', (codigo) => {
      if (!terminado) cerrar(false, `el proceso terminó con código ${codigo ?? '?'}`);
    });

    hijo.stdin.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'tuki-smoke', version: '1.0.0' },
        },
      }) + '\n',
    );
  });
}

const requeridos = [
  resolve(RAIZ, '.tools', 'engram', process.platform === 'win32' ? 'engram.exe' : 'engram'),
  resolve(RAIZ, '.tools', 'codegraph', 'node_modules', '@astudioplus', 'codegraph-mcp', 'bin', 'codegraph-mcp.js'),
];
for (const ruta of requeridos) {
  if (!existsSync(ruta)) {
    console.error(`Falta ${ruta}\nEjecuta scripts/instalar-herramientas.ps1`);
    process.exit(2);
  }
}

const resultados = [];
for (const servidor of SERVIDORES) {
  resultados.push(await probar(servidor));
}

for (const r of resultados) {
  if (r.ok) {
    console.log(`OK  ${r.nombre}: ${r.detalle}`);
    if (VERBOSE) console.log(`    ${r.herramientas.join(', ')}`);
  } else {
    console.error(`FALLO  ${r.nombre}: ${r.detalle}`);
  }
}

process.exit(resultados.every((r) => r.ok) ? 0 : 1);
