#!/usr/bin/env node
/**
 * Promociona una versión ya publicada y firmada al overlay de Kubernetes.
 *
 * Cambia el `newTag` de las dos imágenes en
 * `deploy/k8s/overlays/<ambiente>/kustomization.yaml`. No toca el clúster:
 * ArgoCD detecta el cambio en Git y sincroniza. Ese es el punto: **Git es la
 * única fuente de verdad**.
 *
 * Uso:
 *   node scripts/promover-imagen.mjs v1.2.3
 *   node scripts/promover-imagen.mjs v1.2.3 --ambiente production
 *   node scripts/promover-imagen.mjs 1.2.3 --check   # falla si no coincide
 */
import { readFileSync, writeFileSync } from 'node:fs';

const argumentos = process.argv.slice(2);
const check = argumentos.includes('--check');
const indiceAmbiente = argumentos.indexOf('--ambiente');
const ambiente = indiceAmbiente >= 0 ? argumentos[indiceAmbiente + 1] : 'production';
const tag = argumentos.find((arg, i) => !arg.startsWith('--') && argumentos[i - 1] !== '--ambiente');

if (!tag) {
  console.error('Uso: node scripts/promover-imagen.mjs <tag> [--ambiente production] [--check]');
  process.exit(2);
}

const ruta = `deploy/k8s/overlays/${ambiente}/kustomization.yaml`;
const original = readFileSync(ruta, 'utf8');

// Solo las dos imágenes de Tuki; ignora cualquier otro `newTag` del archivo.
const imagenes = ['ghcr.io/lianlee007/tuki', 'ghcr.io/lianlee007/tuki-ai-gateway'];
let cambios = 0;

const actualizado = original.replace(
  /(- name: (ghcr\.io\/[^\s]+)\r?\n\s+newName: [^\s]+\r?\n\s+newTag: )"?([^"\r\n]+)"?/g,
  (linea, prefijo, nombre, actual) => {
    if (!imagenes.includes(nombre)) return linea;
    if (actual === tag) return linea;
    cambios += 1;
    return `${prefijo}"${tag}"`;
  }
);

if (cambios === 0) {
  console.log(`Sin cambios: ${ambiente} ya apunta a ${tag}.`);
  process.exit(0);
}

if (check) {
  console.error(`Deriva detectada: ${ambiente} no apunta a ${tag} (${cambios} imagen/es).`);
  process.exit(1);
}

writeFileSync(ruta, actualizado);
console.log(`Promovido ${ambiente} → ${tag} (${cambios} imagen/es en ${ruta}).`);
