#!/usr/bin/env node
/**
 * Carga los datos de demostración de TukiTuki en el stack local de Docker.
 *
 * Es idempotente: los seeds usan UUID fijos y `on conflict do nothing`, así que
 * se pueden aplicar tantas veces como haga falta. También crea el superadmin
 * con los valores por defecto (`admin@tukituki.local` / `Admin12345`).
 *
 * Uso:
 *   pnpm demo:sembrar
 *
 * Requisitos: el stack de `pnpm infra:up` debe estar arriba. El contenedor de
 * PostgreSQL se puede cambiar con TUKI_POSTGRES_CONTENEDOR.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contenedor = process.env.TUKI_POSTGRES_CONTENEDOR || 'tukituki-postgresdb';
const usuario = 'tuki_admin';

const seeds = [
  ['tuki_identidad', 'db/seeds/identidad-demo.sql'],
  ['tuki_restaurantes', 'db/seeds/restaurantes-demo.sql'],
  ['tuki_restaurantes', 'db/seeds/platillos-descripciones.sql'],
  ['tuki_restaurantes', 'db/seeds/restaurantes-dietas.sql'],
  ['tuki_restaurantes', 'db/seeds/platillos-demo-extra.sql'],
  ['tuki_resenas', 'db/seeds/resenas-demo.sql'],
];

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function ejecutar(comando, argumentos, opciones = {}) {
  return spawnSync(comando, argumentos, {
    cwd: raiz,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...opciones,
  });
}

function abortar(mensaje) {
  console.error(`\n[datos-demo] ERROR: ${mensaje}\n`);
  process.exit(1);
}

const docker = ejecutar('docker', ['version', '--format', '{{.Server.Version}}']);
if (docker.error || docker.status !== 0) {
  abortar(
    'Docker no está disponible. Enciende Docker Desktop y ejecuta `pnpm infra:up` antes de sembrar los datos.',
  );
}

const existe = ejecutar('docker', ['ps', '-a', '--filter', `name=^${contenedor}$`, '--format', '{{.Names}}']);
if (existe.stdout.trim() !== contenedor) {
  abortar(
    `No encuentro el contenedor ${contenedor}. Levanta el stack con \`pnpm infra:up\` o define TUKI_POSTGRES_CONTENEDOR.`,
  );
}

let listo = false;
for (let intento = 1; intento <= 60; intento += 1) {
  const ping = ejecutar('docker', ['exec', contenedor, 'pg_isready', '-U', usuario, '-d', 'postgres']);
  if (ping.status === 0) {
    listo = true;
    break;
  }
  if (intento === 1) {
    console.log('[datos-demo] Esperando a que PostgreSQL acepte conexiones…');
  }
  await dormir(1000);
}

if (!listo) {
  abortar('PostgreSQL no respondió en 60 segundos. Revisa `docker compose ps` y los logs del contenedor.');
}

/*
 * `infra:up` arranca PostgreSQL antes que las migraciones de los servicios.
 * Si se siembra en ese hueco, las tablas todavía no existen. Se espera a que
 * identidad y restaurantes hayan migrado; el arranque de Windows ya llega aquí
 * con los contenedores sanos, pero el flujo manual puede ejecutarlo antes.
 */
let esquemaListo = false;
for (let intento = 1; intento <= 180; intento += 1) {
  const usuarios = ejecutar('docker', [
    'exec',
    contenedor,
    'psql',
    '-U',
    usuario,
    '-d',
    'tuki_identidad',
    '-tAc',
    "select to_regclass('public.usuarios') is not null",
  ]);
  const restaurantes = ejecutar('docker', [
    'exec',
    contenedor,
    'psql',
    '-U',
    usuario,
    '-d',
    'tuki_restaurantes',
    '-tAc',
    "select to_regclass('public.restaurantes') is not null",
  ]);

  if (usuarios.stdout.trim() === 't' && restaurantes.stdout.trim() === 't') {
    esquemaListo = true;
    break;
  }
  if (intento === 1) {
    console.log('[datos-demo] Esperando a que los servicios apliquen las migraciones…');
  }
  await dormir(1000);
}

if (!esquemaListo) {
  abortar(
    'Las tablas no aparecieron en 180 segundos. Mira `docker compose ps` y los logs de identidad-service y restaurantes-service.',
  );
}

function consultar(base, sql) {
  const resultado = ejecutar('docker', [
    'exec',
    contenedor,
    'psql',
    '-U',
    usuario,
    '-d',
    base,
    '-tAc',
    sql,
  ]);
  if (resultado.status !== 0) {
    abortar(`No pude consultar ${base}.\n${(resultado.stderr || '').trim()}`);
  }
  return resultado.stdout.trim();
}

/*
 * `restaurantes-demo.sql` usa UUID fijos. En una base con datos históricos los
 * mismos slugs pueden existir con otro id y el insert choca contra la clave
 * única de slug. En ese caso los locales demo ya están, así que se omite solo
 * ese archivo y se siguen aplicando los seeds que trabajan por slug.
 */
const idsDemo = "'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'";
const slugsDemo = "'cafe-bolivar','pizzeria-centenario'";
const idsExistentes = Number(
  consultar('tuki_restaurantes', `select count(*) from restaurantes where id in (${idsDemo})`),
);
const slugsExistentes = Number(
  consultar('tuki_restaurantes', `select count(*) from restaurantes where slug in (${slugsDemo})`),
);
const omitirRestaurantes = idsExistentes < 2 && slugsExistentes > 0;

/* Las reseñas usan UUID del catálogo histórico. En una base recién sembrada
 * solo con los dos locales demo no existen: se omiten en vez de romper el FK. */
const resenasAplicables =
  Number(
    consultar(
      'tuki_restaurantes',
      "select count(*) from restaurantes where id = 'ef895a5f-9918-4de2-8b60-1850cba2d441'",
    ),
  ) > 0 &&
  Number(
    consultar(
      'tuki_restaurantes',
      "select count(*) from platillos where id = 'dbe753be-001e-4e3d-80df-b1041193212a'",
    ),
  ) > 0;

for (const [base, archivo] of seeds) {
  if (archivo === 'db/seeds/restaurantes-demo.sql' && omitirRestaurantes) {
    console.log(
      '[datos-demo] Los restaurantes demo ya existen con otro id (datos previos); omito restaurantes-demo.sql.',
    );
    continue;
  }

  if (archivo === 'db/seeds/resenas-demo.sql' && !resenasAplicables) {
    console.log(
      '[datos-demo] No hay catálogo histórico para las reseñas demo; omito resenas-demo.sql.',
    );
    continue;
  }

  const ruta = path.join(raiz, archivo);
  let contenido;
  try {
    contenido = readFileSync(ruta, 'utf8');
  } catch {
    abortar(`No encuentro el seed ${archivo}.`);
  }

  console.log(`[datos-demo] Aplicando ${archivo} → ${base}…`);
  const resultado = ejecutar(
    'docker',
    [
      'exec',
      '-i',
      contenedor,
      'psql',
      '-U',
      usuario,
      '-d',
      base,
      '-v',
      'ON_ERROR_STOP=1',
      '-q',
    ],
    { input: contenido },
  );

  if (resultado.status !== 0) {
    const detalle = (resultado.stderr || resultado.stdout || '').trim();
    abortar(`Falló ${archivo}.\n${detalle}`);
  }
}

console.log('[datos-demo] Creando el superadmin por defecto…');
const superadmin = spawnSync('pnpm --filter identidad-service db:superadmin', {
  cwd: raiz,
  stdio: 'inherit',
  shell: true,
});
if (superadmin.status !== 0) {
  abortar(
    `Los seeds se aplicaron, pero no se pudo crear el superadmin${superadmin.error ? `: ${superadmin.error.message}` : '.'} Ejecuta \`pnpm --filter identidad-service db:superadmin\`.`,
  );
}

console.log(`
[datos-demo] Listo.
  Comensal   cliente@tukituki.local / Demo12345
  Panel      dueno1@tukituki.local  / Demo12345
  Admin      admin@tukituki.local   / Admin12345
`);
