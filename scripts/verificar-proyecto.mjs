#!/usr/bin/env node
/**
 * Verifica de una sola pasada los módulos 1–3 sobre la estación actual.
 *
 * Reproduce el checklist de entrega: tipos, lint, pruebas, build del frontend,
 * lint y pruebas del gateway, renderizado de manifiestos y catálogo. Falla con
 * código 1 si algún paso falla, para que sirva de puerta antes de un PR.
 *
 *   pnpm verificar
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..');
const WIN = process.platform === 'win32';
const VENV = resolve(RAIZ, 'services', 'ai-gateway', '.venv', WIN ? 'Scripts/python.exe' : 'bin/python');

const resultados = [];

function correr(nombre, comando, args, opciones = {}) {
  const inicio = Date.now();
  const r = spawnSync(comando, args, {
    cwd: opciones.cwd ?? RAIZ,
    encoding: 'utf8',
    shell: WIN,
    env: process.env,
  });
  const ok = r.status === 0;
  const salida = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim();
  resultados.push({ nombre, ok });
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`${ok ? 'OK  ' : 'FALLO'}  ${nombre} (${segundos} s)`);
  if (!ok) console.log(salida.split('\n').slice(-8).join('\n'));
  return ok;
}

function disponible(comando, args = ['--version']) {
  const r = spawnSync(comando, args, { encoding: 'utf8', shell: WIN });
  return r.status === 0;
}

const pnpm = WIN ? 'pnpm.cmd' : 'pnpm';
const pythonSistema = WIN ? 'python' : 'python3';
const pythonGateway = existsSync(VENV) ? VENV : pythonSistema;
const gateway = resolve(RAIZ, 'services', 'ai-gateway');

console.log('== Frontend ==');
correr('tipos (tsc)', pnpm, ['typecheck']);
correr('lint (eslint)', pnpm, ['lint']);
correr('pruebas (vitest)', pnpm, ['test']);
correr('build (vite)', pnpm, ['build']);

console.log('== AI Gateway ==');
correr('lint (ruff)', pythonGateway, ['-m', 'ruff', 'check', 'app', 'tests'], { cwd: gateway });
correr('pruebas (pytest)', pythonGateway, ['-m', 'pytest', '-q', '--tb=no'], { cwd: gateway });

console.log('== Manifiestos ==');
if (!disponible('kubectl', ['version', '--client'])) {
  console.log('OMITIDO  kubectl no está instalado; usa deploy/scripts/validar-k8s.sh con Docker');
  resultados.push({ nombre: 'kubectl', ok: false, omitido: true });
} else {
  for (const overlay of ['local', 'local-plataforma', 'production']) {
    correr(`overlay ${overlay}`, 'kubectl', ['kustomize', `deploy/k8s/overlays/${overlay}`]);
  }
  correr('observabilidad', 'kubectl', ['kustomize', 'deploy/observability']);
}

console.log('== Plataforma ==');
correr('catálogo Backstage', pythonSistema, ['scripts/validar-catalogo.py']);

const fallidos = resultados.filter((r) => !r.ok);
console.log('');
if (fallidos.length === 0) {
  console.log(`VERIFICACIÓN OK: ${resultados.length} pasos aprobados.`);
  process.exit(0);
}
console.log(`VERIFICACIÓN FALLIDA: ${fallidos.length} de ${resultados.length} pasos.`);
for (const r of fallidos) console.log(` - ${r.nombre}${r.omitido ? ' (omitido)' : ''}`);
process.exit(1);
