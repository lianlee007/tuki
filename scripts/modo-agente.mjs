#!/usr/bin/env node
/**
 * Cambia el modo de los servidores MCP del proyecto.
 *
 * Las herramientas de cada MCP viajan en el contexto de todos los turnos: con
 * CodeGraph (42) y Engram (23) el piso de tokens sube aunque no se usen. Para
 * tareas que no tocan código ni memoria conviene apagarlos.
 *
 *   node scripts/modo-agente.mjs estado    # muestra el modo actual
 *   node scripts/modo-agente.mjs ligero    # desconecta codegraph y engram
 *   node scripts/modo-agente.mjs completo  # los vuelve a conectar
 *
 * `disabled: true` evita que OpenCode arranque el servidor y suma sus
 * herramientas al contexto. El cambio se aplica en caliente.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CONFIG = resolve(import.meta.dirname, '..', 'opencode.json');
const SERVIDORES = ['codegraph', 'engram'];
const MODOS = ['estado', 'ligero', 'completo'];

const modo = process.argv[2] ?? 'estado';
if (!MODOS.includes(modo)) {
  console.error(`Modo desconocido: ${modo}\nUsa: ${MODOS.join(' | ')}`);
  process.exit(2);
}

const texto = readFileSync(CONFIG, 'utf8').replace(/^\uFEFF/, '');
const config = JSON.parse(texto);
const servidores = config.mcp?.servers;

if (!servidores || typeof servidores !== 'object') {
  console.error('opencode.json no declara mcp.servers. Nada que cambiar.');
  process.exit(2);
}

if (modo === 'estado') {
  for (const nombre of SERVIDORES) {
    const servidor = servidores[nombre];
    if (!servidor) {
      console.log(`${nombre}: no configurado`);
      continue;
    }
    console.log(`${nombre}: ${servidor.disabled ? 'apagado' : 'encendido'}`);
  }
  process.exit(0);
}

const apagar = modo === 'ligero';
for (const nombre of SERVIDORES) {
  if (servidores[nombre]) servidores[nombre].disabled = apagar;
}

writeFileSync(CONFIG, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

console.log(apagar ? 'Modo ligero: MCP apagados.' : 'Modo completo: MCP encendidos.');
console.log(`Actualizado ${CONFIG}`);
console.log('Se aplica en caliente; usa /reload si la app no lo refleja.');
