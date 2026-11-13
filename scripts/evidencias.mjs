#!/usr/bin/env node
/**
 * Genera las evidencias de cadena de suministro de una imagen.
 *
 * Uso:
 *   node scripts/evidencias.mjs --imagen tukituki-ai-gateway:local
 *   node scripts/evidencias.mjs --imagen ghcr.io/lianlee007/tukituki-ai-gateway@sha256:...
 *   node scripts/evidencias.mjs --imagen tukituki-ai-gateway:local --construir services/ai-gateway
 *
 * Salida (por defecto en `evidencias/<fecha>/`):
 *   sbom.cdx.json        SBOM CycloneDX (Syft)
 *   trivy.json           hallazgos completos (Trivy)
 *   trivy.txt            reporte legible
 *   firma.txt            resultado de `cosign verify` si se pasa una referencia
 *   resumen.json         metadatos de la corrida
 *
 * Requiere `syft` y `trivy` en el PATH; `cosign` solo si se verifica firma y
 * `docker` solo si se usa `--construir`. En Windows funcionan los binarios
 * nativos; no hace falta WSL.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);

const valor = (bandera) => {
  const i = args.indexOf(bandera);
  return i >= 0 ? args[i + 1] : undefined;
};

const imagen = valor('--imagen');
const construir = valor('--construir');
const referencia = valor('--ref') ?? valor('--referencia');
const salidaBase = valor('--salida') ?? 'evidencias';

if (!imagen) {
  console.error('Falta --imagen. Ejemplo: --imagen tukituki-ai-gateway:local');
  process.exit(2);
}

const marca = new Date().toISOString().replace(/[:.]/g, '-');
const carpeta = join(salidaBase, marca);
mkdirSync(carpeta, { recursive: true });

const correr = (comando, argumentos, opciones = {}) => {
  const resultado = spawnSync(comando, argumentos, {
    encoding: 'utf8',
    shell: false,
    ...opciones,
  });
  if (resultado.error) {
    throw new Error(`No se pudo ejecutar "${comando}": ${resultado.error.message}`);
  }
  return resultado;
};

const version = (comando, argumentos) => {
  try {
    const r = correr(comando, argumentos);
    return (r.stdout || r.stderr || '').trim().split('\n')[0];
  } catch {
    return 'no disponible';
  }
};

console.log(`Imagen: ${imagen}`);

if (construir) {
  console.log(`Construyendo ${imagen} desde ${construir}...`);
  const build = correr('docker', ['build', '-t', imagen, construir], { stdio: 'inherit' });
  if (build.status !== 0) {
    console.error('La construcción de la imagen falló.');
    process.exit(1);
  }
}

const pasos = [];

console.log('1/3 Generando SBOM CycloneDX con Syft...');
const sbom = correr('syft', [imagen, '-o', `cyclonedx-json=${join(carpeta, 'sbom.cdx.json')}`]);
if (sbom.status !== 0) {
  console.error(sbom.stderr || 'Syft falló.');
  pasos.push({ paso: 'sbom', estado: 'fallido' });
} else {
  pasos.push({ paso: 'sbom', estado: 'ok' });
}

console.log('2/3 Escaneando con Trivy...');
const trivyJson = correr('trivy', [
  'image',
  '--format',
  'json',
  '--output',
  join(carpeta, 'trivy.json'),
  '--no-progress',
  '--ignore-unfixed',
  imagen,
]);
const trivyTexto = correr('trivy', [
  'image',
  '--format',
  'table',
  '--output',
  join(carpeta, 'trivy.txt'),
  '--no-progress',
  '--ignore-unfixed',
  '--severity',
  'CRITICAL,HIGH',
  imagen,
]);
pasos.push({
  paso: 'trivy',
  estado: trivyJson.status === 0 ? 'ok' : 'con hallazgos',
  codigo: trivyJson.status,
});

console.log('3/3 Verificando firma...');
let firma = 'No se pidió verificación (usa --ref para verificar una firma de Cosign).';
if (referencia) {
  const verify = correr('cosign', [
    'verify',
    '--certificate-oidc-issuer',
    'https://token.actions.githubusercontent.com',
    '--certificate-identity-regexp',
    'https://github.com/.+',
    referencia,
  ]);
  firma = `${verify.stdout || ''}${verify.stderr || ''}`.trim() || `cosign terminó con código ${verify.status}`;
  writeFileSync(join(carpeta, 'firma.txt'), `${firma}\n`, 'utf8');
  pasos.push({ paso: 'firma', estado: verify.status === 0 ? 'verificada' : 'no verificada' });
}

const resumen = {
  fecha: new Date().toISOString(),
  imagen,
  referencia: referencia ?? null,
  commit: version('git', ['rev-parse', 'HEAD']),
  herramientas: {
    syft: version('syft', ['version']),
    trivy: version('trivy', ['--version']),
    cosign: version('cosign', ['version']),
  },
  pasos,
  firma,
  carpeta,
};

writeFileSync(join(carpeta, 'resumen.json'), `${JSON.stringify(resumen, null, 2)}\n`, 'utf8');

console.log(`\nEvidencias en: ${carpeta}`);
console.log(`- sbom.cdx.json`);
console.log(`- trivy.json / trivy.txt`);
if (referencia) console.log(`- firma.txt`);
console.log(`- resumen.json`);
