#!/usr/bin/env node
/**
 * Revisión automática de licencias de dependencias de producción.
 *
 * Uso:
 *   pnpm licenses list --prod --json > licencias.json
 *   node scripts/licencias.mjs licencias.json
 *
 * El objetivo no es bloquear cualquier licencia copyleft, sino impedir que
 * entre al producto una licencia incompatible con su distribución (GPL/AGPL)
 * sin una decisión explícita. Las licencias débiles (MPL, LGPL) se reportan
 * como aviso para revisión.
 */
import { readFileSync } from 'node:fs';

/** Licencias aceptadas para distribuir el producto sin obligaciones extra. */
const PERMITIDAS = new Set([
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BlueOak-1.0.0',
  'CC0-1.0',
  'CC-BY-4.0',
  'ISC',
  'MIT',
  'MIT-0',
  'Python-2.0',
  'Unlicense',
  'WTFPL',
]);

/** Licencias que se aceptan con revisión (copyleft débil o de archivo). */
const REVISAR = new Set(['MPL-2.0', 'LGPL-2.1', 'LGPL-3.0', 'EPL-2.0', 'CDDL-1.0']);

/** Licencias que no deben entrar al producto sin decisión del comité. */
const BLOQUEADAS = [/^AGPL/i, /^GPL/i, /^SSPL/i, /^BUSL/i, /^Commons-Clause/i];

const archivo = process.argv[2] ?? 'licencias.json';

let datos;
try {
  datos = JSON.parse(readFileSync(archivo, 'utf8'));
} catch (error) {
  console.error(`No se pudo leer ${archivo}: ${error.message}`);
  process.exit(2);
}

const resumen = [];
const bloqueadas = [];
const porRevisar = [];
let total = 0;

for (const [licencia, paquetes] of Object.entries(datos)) {
  const lista = Array.isArray(paquetes) ? paquetes : [];
  total += lista.length;
  resumen.push({ licencia, paquetes: lista.length });

  if (BLOQUEADAS.some((patron) => patron.test(licencia))) {
    bloqueadas.push({ licencia, paquetes: lista.map((p) => `${p.name}@${p.versions?.join(',')}`) });
  } else if (!PERMITIDAS.has(licencia) && !REVISAR.has(licencia)) {
    porRevisar.push({ licencia, paquetes: lista.map((p) => `${p.name}@${p.versions?.join(',')}`) });
  }
}

console.log(`Dependencias de producción analizadas: ${total}`);
console.log('\nDistribución por licencia:');
for (const { licencia, paquetes } of resumen.sort((a, b) => b.paquetes - a.paquetes)) {
  console.log(`  ${licencia.padEnd(24)} ${paquetes}`);
}

if (porRevisar.length > 0) {
  console.warn('\nLicencias no clasificadas (revisar, no bloquean):');
  for (const { licencia, paquetes } of porRevisar) {
    console.warn(`  ${licencia}: ${paquetes.join(', ')}`);
  }
}

if (bloqueadas.length > 0) {
  console.error('\nLicencias incompatibles con la distribución del producto:');
  for (const { licencia, paquetes } of bloqueadas) {
    console.error(`  ${licencia}: ${paquetes.join(', ')}`);
  }
  console.error('\nSustituye el paquete o documenta la excepción en docs/security/hallazgos.md.');
  process.exit(1);
}

console.log('\nSin licencias bloqueadas.');
