#!/usr/bin/env node
/**
 * Fija las imágenes del overlay de producción por digest.
 *
 * Entrada: el artefacto `digests` que publica el workflow de cadena de
 * suministro (una línea por imagen, con el formato
 * `ghcr.io/owner/imagen@sha256:...`).
 *
 * Uso:
 *   node scripts/fijar-digests.mjs \
 *     --digests digests.txt \
 *     --overlay infra/k8s/overlays/production/kustomization.yaml
 *
 * Es idempotente: si el digest ya está fijado, no cambia nada.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const valor = (bandera) => {
  const i = args.indexOf(bandera);
  return i >= 0 ? args[i + 1] : undefined;
};

const rutaDigests = valor('--digests') ?? 'digests.txt';
const rutaOverlay =
  valor('--overlay') ?? 'infra/k8s/overlays/production/kustomization.yaml';

const digests = new Map();
for (const linea of readFileSync(rutaDigests, 'utf8').split(/\r?\n/)) {
  const limpia = linea.trim();
  if (!limpia || limpia.startsWith('#')) continue;
  const coincidencia = limpia.match(/^(\S+)@(sha256:[a-f0-9]{64})$/);
  if (!coincidencia) {
    console.warn(`Línea ignorada (no es un digest): ${limpia}`);
    continue;
  }
  digests.set(coincidencia[1], coincidencia[2]);
}

if (digests.size === 0) {
  console.error(`No se encontró ningún digest válido en ${rutaDigests}`);
  process.exit(1);
}

let contenido = readFileSync(rutaOverlay, 'utf8');
let reemplazos = 0;

for (const [imagen, digest] of digests) {
  const escapada = imagen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patron = new RegExp(
    `(^\\s*- name:\\s*${escapada}\\s*\\n(?:\\s+newName:\\s*\\S+\\s*\\n)?\\s*)(?:newTag|digest):\\s*\\S+`,
    'm',
  );
  if (!patron.test(contenido)) {
    console.warn(`La imagen ${imagen} no aparece en ${rutaOverlay}`);
    continue;
  }
  contenido = contenido.replace(patron, `$1digest: ${digest}`);
  reemplazos += 1;
}

if (reemplazos > 0) {
  writeFileSync(rutaOverlay, contenido.replace(/\r\n/g, '\n'), 'utf8');
}

console.log(`Digests leídos: ${digests.size}`);
console.log(`Imágenes actualizadas en el overlay: ${reemplazos}`);
