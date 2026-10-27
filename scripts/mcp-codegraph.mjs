#!/usr/bin/env node
/**
 * Arranca el servidor MCP de CodeGraph con la configuración del proyecto.
 *
 * CodeGraph se instala en `.tools/codegraph` (fuera de las dependencias de la
 * aplicación) para no cargar el pipeline de CI con un motor nativo de ~100 MB.
 * `scripts/instalar-herramientas.ps1` lo deja listo.
 *
 * La telemetría del paquete se desactiva: el proyecto no envía datos de uso a
 * terceros sin una decisión explícita (módulo 3, privacidad).
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..');
const ENTRADA = resolve(
  RAIZ,
  '.tools',
  'codegraph',
  'node_modules',
  '@astudioplus',
  'codegraph-mcp',
  'bin',
  'codegraph-mcp.js',
);

if (!existsSync(ENTRADA)) {
  console.error(
    'CodeGraph no está instalado. Ejecuta: powershell -ExecutionPolicy Bypass -File scripts/instalar-herramientas.ps1',
  );
  process.exit(2);
}

const hijo = spawn(
  process.execPath,
  [
    ENTRADA,
    '--mcp',
    '--workspace',
    RAIZ,
    '--exclude',
    'node_modules',
    '--exclude',
    '.tools',
    '--exclude',
    '.opencode',
    '--exclude',
    'Skills',
    '--exclude',
    'dist',
    '--exclude',
    'build',
    '--exclude',
    'coverage',
  ],
  {
    cwd: RAIZ,
    stdio: 'inherit',
    env: { ...process.env, CODEGRAPH_TELEMETRY: 'off' },
  },
);

hijo.on('exit', (codigo, senal) => {
  if (senal) process.kill(process.pid, senal);
  else process.exit(codigo ?? 0);
});
