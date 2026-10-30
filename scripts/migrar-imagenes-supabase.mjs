#!/usr/bin/env node
/**
 * Migra las imágenes que hoy viven en Cloudinary a Supabase Storage.
 *
 * Qué hace, en orden:
 *   1. Crea los buckets `platillos` y `restaurantes` si no existen.
 *   2. Descarga cada imagen de Cloudinary sin transformaciones (`q_auto`).
 *   3. La sube a Storage como `<bucket>/<id>.<ext>`.
 *   4. Actualiza `platillos.imagen_url` / `restaurantes.imagen_*_url`.
 *
 * Requisitos:
 *   - `db/migraciones/2026-10-29-storage-imagenes.sql` ya aplicado.
 *   - `SUPABASE_SERVICE_ROLE_KEY` en el entorno o en `.env.local`
 *     (Dashboard → Project Settings → API). Es temporal: bórrala al terminar.
 *
 * Uso:
 *   node scripts/migrar-imagenes-supabase.mjs            # migra
 *   node scripts/migrar-imagenes-supabase.mjs --dry-run  # solo enseña el plan
 *
 * Es idempotente: si una URL ya apunta a Supabase, la salta.
 */
import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';

const DRY_RUN = process.argv.includes('--dry-run');

const cargarEnv = () => {
  const env = { ...process.env };
  try {
    const texto = readFileSync('.env.local', 'utf8');
    for (const linea of texto.split(/\r?\n/)) {
      const match = linea.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, clave, valor] = match;
      env[clave] ??= valor.replace(/^["']|["']$/g, '');
    }
  } catch {
    // Sin .env.local: se usan solo las variables del entorno.
  }
  return env;
};

const env = cargarEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('Falta VITE_SUPABASE_URL (o SUPABASE_URL).');
  process.exit(1);
}
if (!SERVICE_KEY && !DRY_RUN) {
  console.error(
    'Falta SUPABASE_SERVICE_ROLE_KEY. Añádela al entorno solo para esta migración\n' +
      '(Dashboard → Project Settings → API) y bórrala al terminar.'
  );
  process.exit(1);
}

const cabeceras = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

const rest = (ruta, init = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
    ...init,
    headers: { ...cabeceras, ...(init.headers || {}) },
  });

const buckets = [
  { id: 'platillos', limite: 5242880 },
  { id: 'restaurantes', limite: 5242880 },
];

const crearBuckets = async () => {
  const { data } = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    headers: cabeceras,
  }).then((r) => r.json().then((data) => ({ data })));
  const existentes = new Set((data || []).map((b) => b.id));

  for (const bucket of buckets) {
    if (existentes.has(bucket.id)) continue;
    if (DRY_RUN) {
      console.log(`[dry-run] crear bucket ${bucket.id}`);
      continue;
    }
    const respuesta = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: cabeceras,
      body: JSON.stringify({
        id: bucket.id,
        name: bucket.id,
        public: true,
        file_size_limit: bucket.limite,
        allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
      }),
    });
    if (!respuesta.ok) {
      throw new Error(`No se pudo crear el bucket ${bucket.id}: ${respuesta.status} ${await respuesta.text()}`);
    }
    console.log(`Bucket creado: ${bucket.id}`);
  }
};

/** Cloudinary sirve WebP/AVIF con `q_auto,f_auto`; para migrar queremos el original. */
const urlOriginal = (url) => url.replace('/upload/q_auto,f_auto/', '/upload/');

const extensionDe = (url, contentType) => {
  const ext = extname(new URL(url).pathname).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) return ext === '.jpeg' ? '.jpg' : ext;
  if (contentType?.includes('png')) return '.png';
  if (contentType?.includes('webp')) return '.webp';
  if (contentType?.includes('avif')) return '.avif';
  return '.jpg';
};

const subir = async (bucket, id, url) => {
  const origen = urlOriginal(url);
  const respuesta = await fetch(origen);
  if (!respuesta.ok) throw new Error(`Cloudinary respondió ${respuesta.status} para ${origen}`);
  const bytes = Buffer.from(await respuesta.arrayBuffer());
  const ext = extensionDe(origen, respuesta.headers.get('content-type'));
  const ruta = `${bucket}/${id}${ext}`;

  if (DRY_RUN) {
    console.log(`[dry-run] ${basename(origen)} → ${bucket}/${ruta} (${(bytes.length / 1024).toFixed(0)} KB)`);
    return `${SUPABASE_URL}/storage/v1/object/public/${ruta}`;
  }

  const subida = await fetch(`${SUPABASE_URL}/storage/v1/object/${ruta}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': respuesta.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'max-age=31536000',
      'x-upsert': 'true',
    },
    body: bytes,
  });
  if (!subida.ok) throw new Error(`Fallo subiendo ${ruta}: ${subida.status} ${await subida.text()}`);

  return `${SUPABASE_URL}/storage/v1/object/public/${ruta}`;
};

const actualizar = async (tabla, id, campos) => {
  if (DRY_RUN) return;
  const respuesta = await rest(`${tabla}?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(campos),
    headers: { Prefer: 'return=minimal' },
  });
  if (!respuesta.ok) throw new Error(`Fallo actualizando ${tabla}/${id}: ${respuesta.status} ${await respuesta.text()}`);
};

const esCloudinary = (url) => typeof url === 'string' && url.includes('res.cloudinary.com');

const main = async () => {
  await crearBuckets();

  const platillos = await rest('platillos?select=id,nombre,imagen_url').then((r) => r.json());
  const conCloudinary = platillos.filter((p) => esCloudinary(p.imagen_url));
  console.log(`Platillos con imagen en Cloudinary: ${conCloudinary.length} de ${platillos.length}`);

  let migradas = 0;
  for (const platillo of conCloudinary) {
    try {
      const url = await subir('platillos', platillo.id, platillo.imagen_url);
      await actualizar('platillos', platillo.id, { imagen_url: url, imagen_public_id: null });
      migradas += 1;
      console.log(`  ✓ ${platillo.nombre}`);
    } catch (error) {
      console.error(`  ✗ ${platillo.nombre}: ${error.message}`);
    }
  }

  const restaurantes = await rest(
    'restaurantes?select=id,nombre,imagen_banner_url,imagen_logo_url'
  ).then((r) => r.json());

  for (const restaurante of restaurantes) {
    const cambios = {};
    for (const [campo, url] of [
      ['imagen_banner_url', restaurante.imagen_banner_url],
      ['imagen_logo_url', restaurante.imagen_logo_url],
    ]) {
      if (!esCloudinary(url)) continue;
      try {
        cambios[campo] = await subir('restaurantes', `${restaurante.id}-${campo.split('_')[1]}`, url);
        cambios[campo.replace('_url', '_public_id')] = null;
      } catch (error) {
        console.error(`  ✗ ${restaurante.nombre} (${campo}): ${error.message}`);
      }
    }
    if (Object.keys(cambios).length) {
      await actualizar('restaurantes', restaurante.id, cambios);
      console.log(`  ✓ ${restaurante.nombre} (banner/logo)`);
    }
  }

  console.log(`\nListo: ${migradas} platillos migrados${DRY_RUN ? ' (simulación)' : ''}.`);
  if (!DRY_RUN) console.log('Borra SUPABASE_SERVICE_ROLE_KEY del entorno cuando termines.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
