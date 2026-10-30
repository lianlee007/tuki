#!/usr/bin/env node
/**
 * Guardián de la arquitectura: comprueba que las dependencias apunten hacia
 * dentro y que los módulos no se salten su API pública.
 *
 * Reglas del frontend (monolito modular):
 *   - `src/modulos/<m>/dominio/**` no importa React, Zustand, Supabase ni
 *     capas de aplicación/infraestructura. Es lógica pura.
 *   - Un módulo no importa las capas internas de otro: usa su `index.ts`.
 *   - `src/lib/**` y `src/api/**` no dependen de componentes ni de páginas.
 *
 * Reglas del gateway (arquitectura hexagonal):
 *   - `dominio` no importa servicios, puertos ni adaptadores.
 *   - `puertos` no importa servicios ni adaptadores.
 *   - `servicios` no importa adaptadores ni FastAPI/httpx.
 *   - `adaptadores` no importa `main`.
 *
 * Uso:
 *   node scripts/verificar-arquitectura.mjs
 *   node scripts/verificar-arquitectura.mjs --verbose
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..');
const VERBOSE = process.argv.includes('--verbose');
const MODULOS = resolve(RAIZ, 'src', 'modulos');
const GATEWAY = resolve(RAIZ, 'services', 'ai-gateway', 'app');

const PROHIBIDO_EN_DOMINIO = [
  'react',
  'react-dom',
  'zustand',
  '@supabase/supabase-js',
  'framer-motion',
];

const violaciones = [];
let revisados = 0;

function archivos(directorio, extensiones) {
  const salida = [];
  for (const entrada of readdirSync(directorio, { withFileTypes: true })) {
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) salida.push(...archivos(ruta, extensiones));
    else if (extensiones.includes(extname(entrada.name))) salida.push(ruta);
  }
  return salida;
}

function rutaRelativa(archivo) {
  return relative(RAIZ, archivo).split(sep).join('/');
}

/** Devuelve los especificadores de import/export de un archivo TS. */
function importsTs(archivo) {
  const texto = readFileSync(archivo, 'utf8');
  const patron = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;
  const salida = [];
  for (const coincidencia of texto.matchAll(patron)) salida.push(coincidencia[1]);
  return salida;
}

function importsPython(archivo) {
  const texto = readFileSync(archivo, 'utf8');
  const salida = [];
  for (const linea of texto.split('\n')) {
    const desde = linea.match(/^\s*from\s+([\w.]+)\s+import/);
    const directo = linea.match(/^\s*import\s+([\w.]+)/);
    if (desde) salida.push(desde[1]);
    else if (directo) salida.push(directo[1]);
  }
  return salida;
}

function anotar(archivo, regla, detalle) {
  violaciones.push(`${rutaRelativa(archivo)} · ${regla} · ${detalle}`);
}

// --- Frontend ---------------------------------------------------------------

for (const archivo of archivos(MODULOS, ['.ts', '.tsx'])) {
  revisados += 1;
  const relativo = rutaRelativa(archivo);
  const partes = relativo.split('/');
  const modulo = partes[2];
  const capa = partes[3];

  for (const especificador of importsTs(archivo)) {
    const esPaquete = !especificador.startsWith('.') && !especificador.startsWith('@/');
    const prohibido = PROHIBIDO_EN_DOMINIO.some(
      (paquete) =>
        especificador === paquete || especificador.startsWith(`${paquete}/`),
    );

    if (capa === 'dominio' && esPaquete && prohibido) {
      anotar(archivo, 'dominio puro', `no puede importar «${especificador}»`);
      continue;
    }

    if (!especificador.startsWith('.')) continue;

    const destino = rutaRelativa(resolve(dirname(archivo), especificador));
    const destinoModulo = destino.match(/^src\/modulos\/([^/]+)\/([^/]+)/);

    if (destinoModulo && destinoModulo[1] !== modulo) {
      anotar(
        archivo,
        'frontera entre módulos',
        `importa la capa interna de «${destinoModulo[1]}»; usa src/modulos/${destinoModulo[1]}`,
      );
      continue;
    }

    if (capa === 'dominio' && destinoModulo && destinoModulo[1] === modulo) {
      const capaDestino = destinoModulo[2];
      if (capaDestino === 'aplicacion' || capaDestino === 'infraestructura' || capaDestino === 'componentes') {
        anotar(archivo, 'dirección de dependencias', `el dominio no puede depender de «${capaDestino}»`);
      }
    }
  }
}

for (const carpeta of ['lib', 'api']) {
  for (const archivo of archivos(resolve(RAIZ, 'src', carpeta), ['.ts', '.tsx'])) {
    revisados += 1;
    for (const especificador of importsTs(archivo)) {
      if (!especificador.startsWith('.')) continue;
      const destino = rutaRelativa(resolve(dirname(archivo), especificador));
      if (/^src\/(componentes|paginas|contexto|hooks)\//.test(destino)) {
        anotar(archivo, `src/${carpeta} sin interfaz`, `importa «${destino}»`);
      }
    }
  }
}

// --- Gateway ----------------------------------------------------------------

const CAPAS = {
  dominio: ['servicios', 'puertos', 'adaptadores'],
  puertos: ['servicios', 'adaptadores'],
  servicios: ['adaptadores'],
  adaptadores: ['main'],
};

for (const archivo of archivos(GATEWAY, ['.py'])) {
  revisados += 1;
  const relativo = rutaRelativa(archivo);
  const partes = relativo.split('/');
  const capa = partes[3];
  const capasProhibidas = CAPAS[capa] ?? [];

  for (const destino of importsPython(archivo)) {
    if (capa === 'dominio' && (destino === 'fastapi' || destino.startsWith('fastapi.') || destino === 'httpx')) {
      anotar(archivo, 'dominio puro', `no puede importar «${destino}»`);
      continue;
    }
    if (capa === 'servicios' && (destino === 'fastapi' || destino.startsWith('fastapi.') || destino === 'httpx')) {
      anotar(archivo, 'caso de uso sin HTTP', `no puede importar «${destino}»`);
      continue;
    }
    const modulo = destino.split('.')[1];
    if (modulo && capasProhibidas.includes(modulo)) {
      anotar(archivo, 'dirección de dependencias', `«${capa}» no puede importar «${destino}»`);
    }
  }
}

// --- Resultado --------------------------------------------------------------

if (VERBOSE) console.log(`Archivos revisados: ${revisados}`);
if (violaciones.length === 0) {
  console.log(`Arquitectura OK: ${revisados} archivos revisados, 0 violaciones.`);
  process.exit(0);
}

console.log(`Arquitectura: ${violaciones.length} violación(es).`);
for (const violacion of violaciones.slice(0, 40)) console.log(`  - ${violacion}`);
if (violaciones.length > 40) console.log(`  … y ${violaciones.length - 40} más`);
process.exit(1);
