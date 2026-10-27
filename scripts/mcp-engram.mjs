#!/usr/bin/env node
/**
 * Arranca el servidor MCP de Engram para el proyecto Tuki.
 *
 * `--project tuki` fija el espacio de memoria: las decisiones del proyecto no
 * se mezclan con las de otros repositorios del equipo. El perfil `agent` expone
 * las 23 herramientas de trabajo (recordar, buscar, contexto, consolidar) y
 * deja fuera las administrativas.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..');
const BINARIO = resolve(RAIZ, '.tools', 'engram', process.platform === 'win32' ? 'engram.exe' : 'engram');

if (!existsSync(BINARIO)) {
  console.error(
    'Engram no está instalado. Ejecuta: powershell -ExecutionPolicy Bypass -File scripts/instalar-herramientas.ps1',
  );
  process.exit(2);
}

const hijo = spawn(
  BINARIO,
  ['mcp', '--project', 'tuki', '--tools=agent', ...process.argv.slice(2)],
  { cwd: RAIZ, stdio: 'inherit' },
);

hijo.on('exit', (codigo, senal) => {
  if (senal) process.kill(process.pid, senal);
  else process.exit(codigo ?? 0);
});
