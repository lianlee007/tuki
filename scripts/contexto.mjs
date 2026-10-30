#!/usr/bin/env node
/**
 * Informe de contexto de una sesión de OpenCode.
 *
 * El coste real de una sesión no está en el prompt inicial sino en el historial:
 * cada paso reenvía los mensajes anteriores y las salidas de herramientas. Este
 * informe lee la base local de OpenCode (solo lectura) y responde tres preguntas:
 *
 *   1. ¿Cuánto contexto ocupa la última petición?
 *   2. ¿Qué herramientas generaron las salidas más grandes?
 *   3. ¿Qué recorte conviene aplicar ahora?
 *
 * Uso:
 *   pnpm contexto
 *   node scripts/contexto.mjs --limite 8
 *   node scripts/contexto.mjs --sesion ses_... --json
 *
 * Requiere Node 22.13 o superior (`node:sqlite` sin flag). No modifica la base
 * de OpenCode: la abre en modo readOnly.
 */
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const AYUDA = `Informe de contexto de una sesión de OpenCode.

Opciones:
  -s, --sesion <id>       Sesión concreta (por defecto, la última del proyecto)
  -p, --proyecto <ruta>   Proyecto a consultar (por defecto, el directorio actual)
  -l, --limite <n>        Filas en las tablas de salida (por defecto, 5)
      --limite-kb <n>     Umbral de salida grande en KB (por defecto, 16)
      --json              Salida legible por máquina
  -h, --ayuda             Esta ayuda

Ejemplos:
  pnpm contexto
  pnpm contexto -- --limite 8
  node scripts/contexto.mjs --sesion ses_abc --json
`;

const opciones = leerOpciones();
if (opciones.ayuda) {
  console.log(AYUDA.trimEnd());
  process.exit(0);
}

const RUTA_BD =
  process.env.OPENCODE_DB ??
  join(homedir(), '.local', 'share', 'opencode', 'opencode.db');

if (!existsSync(RUTA_BD)) {
  fallar(
    `No existe la base de OpenCode en ${RUTA_BD}.\n` +
      'Abre una sesión al menos una vez o define OPENCODE_DB con la ruta correcta.',
  );
}

let DatabaseSync;
try {
  ({ DatabaseSync } = await import('node:sqlite'));
} catch {
  fallar(
    'Este informe necesita Node 22.13 o superior (módulo node:sqlite).\n' +
      `Versión actual: ${process.version}.`,
  );
}

let db;
try {
  db = new DatabaseSync(RUTA_BD, { readOnly: true });
  const sesion = elegirSesion(db);
  const mensajes = db
    .prepare('select data from session_message where session_id = ? order by seq')
    .all(sesion.id);
  const informe = construirInforme(sesion, mensajes);
  if (opciones.json) console.log(JSON.stringify(informe, null, 2));
  else imprimir(informe);
} catch (error) {
  fallar(`No se pudo leer la sesión: ${error.message}`);
} finally {
  db?.close();
}

// ---------------------------------------------------------------------------

function leerOpciones() {
  try {
    const { values } = parseArgs({
      options: {
        sesion: { type: 'string', short: 's' },
        proyecto: { type: 'string', short: 'p' },
        limite: { type: 'string', short: 'l', default: '5' },
        'limite-kb': { type: 'string', default: '16' },
        json: { type: 'boolean', default: false },
        ayuda: { type: 'boolean', short: 'h', default: false },
      },
      allowPositionals: false,
    });
    return {
      ...values,
      limite: entero(values.limite, 5, 1, 50),
      limiteKb: entero(values['limite-kb'], 16, 1, 1024),
    };
  } catch (error) {
    fallar(`${error.message}\n\n${AYUDA.trimEnd()}`);
  }
}

function entero(valor, porDefecto, minimo, maximo) {
  const n = Number.parseInt(valor ?? '', 10);
  if (!Number.isFinite(n)) return porDefecto;
  return Math.min(maximo, Math.max(minimo, n));
}

function elegirSesion(base) {
  const columnas = `
    id, title, directory, agent, model,
    tokens_input, tokens_output, tokens_reasoning,
    tokens_cache_read, tokens_cache_write, cost, time_updated
  `;

  if (opciones.sesion) {
    const fila = base
      .prepare(`select ${columnas} from session_v2 where id = ?`)
      .get(opciones.sesion);
    if (!fila) fallar(`No existe la sesión ${opciones.sesion}.`);
    return { ...fila, aproximada: false };
  }

  const directorio = normalizarRuta(opciones.proyecto ?? process.cwd());
  const comparacion =
    process.platform === 'win32'
      ? "lower(replace(directory, '\\', '/')) = ?"
      : "replace(directory, '\\', '/') = ?";
  const fila = base
    .prepare(
      `select ${columnas} from session_v2
       where ${comparacion}
       order by time_updated desc limit 1`,
    )
    .get(directorio);

  if (fila) return { ...fila, aproximada: false };

  const ultima = base
    .prepare(`select ${columnas} from session_v2 order by time_updated desc limit 1`)
    .get();
  if (!ultima) fallar('La base de OpenCode no tiene sesiones registradas.');
  return { ...ultima, aproximada: true };
}

function construirInforme(sesion, mensajes) {
  const contexto = contextoActual(mensajes);
  const herramientas = new Map();
  const mayores = [];
  let llamadas = 0;
  let bytesSalidas = 0;

  for (const fila of mensajes) {
    let mensaje;
    try {
      mensaje = JSON.parse(fila.data);
    } catch {
      continue;
    }
    for (const parte of mensaje.content ?? []) {
      if (parte?.type !== 'tool') continue;
      if (parte.state?.status && parte.state.status !== 'completed') continue;

      const texto = textoSalida(parte);
      const bytes = Buffer.byteLength(texto, 'utf8');
      llamadas += 1;
      bytesSalidas += bytes;

      const acumulado = herramientas.get(parte.name) ?? { llamadas: 0, bytes: 0 };
      acumulado.llamadas += 1;
      acumulado.bytes += bytes;
      herramientas.set(parte.name, acumulado);

      mayores.push({
        herramienta: parte.name,
        bytes,
        resumen: resumenEntrada(parte),
      });
    }
  }

  mayores.sort((a, b) => b.bytes - a.bytes);
  const umbral = opciones.limiteKb * 1024;
  const grandes = mayores.filter((m) => m.bytes > umbral);
  const config = leerConfiguracion();

  return {
    sesion: {
      id: sesion.id,
      titulo: sesion.title,
      directorio: sesion.directory,
      agente: sesion.agent,
      modelo: formatearModelo(sesion.model),
      actualizada: new Date(sesion.time_updated).toISOString(),
      aproximada: sesion.aproximada,
    },
    contexto,
    acumulado: {
      entrada: sesion.tokens_input,
      cacheLectura: sesion.tokens_cache_read,
      cacheEscritura: sesion.tokens_cache_write,
      salida: sesion.tokens_output,
      razonamiento: sesion.tokens_reasoning,
      coste: sesion.cost,
      tokens: sesion.tokens_input + sesion.tokens_cache_read,
    },
    herramientas: [...herramientas]
      .map(([nombre, datos]) => ({ nombre, ...datos }))
      .sort((a, b) => b.bytes - a.bytes),
    mayores: mayores.slice(0, opciones.limite),
    totales: {
      llamadas,
      bytesSalidas,
      tokensSalidas: estimarTokens(bytesSalidas),
      grandes: grandes.length,
      bytesGrandes: grandes.reduce((suma, m) => suma + m.bytes, 0),
      umbralKb: opciones.limiteKb,
    },
    configuracion: config,
    recomendaciones: recomendar({
      contexto,
      totales: {
        llamadas,
        tokensSalidas: estimarTokens(bytesSalidas),
        grandes: grandes.length,
      },
      mayores,
      config,
    }),
  };
}

function contextoActual(mensajes) {
  for (let i = mensajes.length - 1; i >= 0; i -= 1) {
    let mensaje;
    try {
      mensaje = JSON.parse(mensajes[i].data);
    } catch {
      continue;
    }
    const t = mensaje.tokens;
    if (!t) continue;
    const cache = t.cache ?? {};
    return {
      tokens: (t.input ?? 0) + (cache.read ?? 0) + (cache.write ?? 0),
      nuevos: t.input ?? 0,
      cacheLectura: cache.read ?? 0,
      cacheEscritura: cache.write ?? 0,
    };
  }
  return { tokens: 0, nuevos: 0, cacheLectura: 0, cacheEscritura: 0 };
}

function textoSalida(parte) {
  const estado = parte.state ?? {};
  const contenido = estado.content ?? estado.output ?? estado.result ?? '';
  if (typeof contenido === 'string') return contenido;
  try {
    return JSON.stringify(contenido);
  } catch {
    return '';
  }
}

function resumenEntrada(parte) {
  const entrada = parte.state?.input ?? {};
  const valor =
    entrada.command ??
    entrada.filePath ??
    entrada.path ??
    entrada.url ??
    entrada.query ??
    entrada.pattern ??
    entrada.description ??
    entrada.code ??
    '';
  return String(valor).replace(/\s+/g, ' ').trim().slice(0, 96);
}

function leerConfiguracion() {
  try {
    const ruta = resolve(opciones.proyecto ?? process.cwd(), 'opencode.json');
    const config = JSON.parse(readFileSync(ruta, 'utf8').replace(/^\uFEFF/, ''));
    return {
      poda: config.compaction?.prune === true,
      maxLineas: config.tool_output?.max_lines ?? null,
      maxBytes: config.tool_output?.max_bytes ?? null,
      mcpLigero: Object.values(config.mcp?.servers ?? {}).every((s) => s?.disabled === true),
    };
  } catch {
    return { poda: false, maxLineas: null, maxBytes: null, mcpLigero: false };
  }
}

function recomendar({ contexto, totales, mayores, config }) {
  const avisos = [];

  if (contexto.tokens >= 80_000) {
    avisos.push(
      `El contexto ronda ${kilotokens(contexto.tokens)}: cierra el bloque con /compact antes de seguir.`,
    );
  } else if (contexto.tokens >= 50_000) {
    avisos.push(
      `El contexto ronda ${kilotokens(contexto.tokens)}: evita lecturas completas y delega búsquedas amplias en el subagente explore.`,
    );
  }

  if (totales.grandes > 0) {
    const peor = mayores[0];
    avisos.push(
      `${totales.grandes} salida(s) superan ${opciones.limiteKb} KB. La mayor es ${peor.herramienta} (${kilobytes(peor.bytes)}): usa grep -m, limit/offset o -First/-Tail y vuelve a medir.`,
    );
  } else if (totales.tokensSalidas > 8_000) {
    avisos.push(
      `Las herramientas acumulan ${kilotokens(totales.tokensSalidas)} en ${totales.llamadas} llamadas: poda con /compact o deja que compaction.prune recorte las salidas viejas.`,
    );
  }

  if (!config.poda) {
    avisos.push(
      'compaction.prune no está activo: las salidas de herramientas viejas se reenvían en cada paso.',
    );
  }

  if (config.maxLineas && config.maxLineas > 300) {
    avisos.push(
      `tool_output.max_lines es ${config.maxLineas}: bajarlo a 300 recorta volcados accidentales.`,
    );
  }

  if (avisos.length === 0) {
    avisos.push('Sin señales de desperdicio: el contexto y las salidas están bajo control.');
  }

  return avisos;
}

function imprimir(informe) {
  const { sesion, contexto, acumulado, herramientas, mayores, totales, configuracion } =
    informe;

  console.log(`Contexto de la sesión «${sesion.titulo}»`);
  if (sesion.aproximada) {
    console.log('  aviso     no hay sesión de este proyecto; se muestra la última global');
  }
  console.log(`  id        ${sesion.id}`);
  console.log(`  modelo    ${sesion.modelo ?? 'desconocido'}`);
  console.log(`  contexto  ~${kilotokens(contexto.tokens)} en la última petición`);
  console.log(
    `            ${kilotokens(contexto.nuevos)} nuevos + ${kilotokens(contexto.cacheLectura)} de caché`,
  );
  console.log(
    `  acumulado ${kilotokens(acumulado.tokens)} de entrada (${kilotokens(acumulado.cacheLectura)} en caché)`,
  );
  console.log(
    `            ${kilotokens(acumulado.salida)} de salida · ${kilotokens(acumulado.razonamiento)} de razonamiento`,
  );
  console.log(`  coste     ${formatearCoste(acumulado.coste)}`);

  console.log('');
  console.log(
    `Salidas de herramientas (${totales.llamadas} llamadas, ~${kilotokens(totales.tokensSalidas)})`,
  );
  if (herramientas.length === 0) {
    console.log('  sin salidas registradas');
  } else {
    const ancho = Math.max(...herramientas.map((h) => h.nombre.length), 8);
    for (const h of herramientas.slice(0, opciones.limite)) {
      console.log(
        `  ${h.nombre.padEnd(ancho)}  ${String(h.llamadas).padStart(3)} llamadas  ${kilobytes(h.bytes).padStart(9)}`,
      );
    }
  }

  console.log('');
  console.log(`Mayores salidas (umbral ${totales.umbralKb} KB)`);
  if (mayores.length === 0) {
    console.log('  sin salidas registradas');
  } else {
    mayores.forEach((m, i) => {
      const detalle = m.resumen ? `  ${m.resumen}` : '';
      console.log(
        `  ${String(i + 1).padStart(2)}. ${m.herramienta.padEnd(10)} ${kilobytes(m.bytes).padStart(9)}${detalle}`,
      );
    });
  }

  console.log('');
  console.log('Configuración');
  console.log(
    `  poda=${configuracion.poda ? 'on' : 'off'} · tool_output=${configuracion.maxLineas ?? '?'} líneas / ${configuracion.maxBytes ?? '?'} bytes · mcp=${configuracion.mcpLigero ? 'ligero' : 'completo'}`,
  );

  console.log('');
  console.log('Recomendaciones');
  for (const aviso of informe.recomendaciones) console.log(`  - ${aviso}`);
}

function normalizarRuta(ruta) {
  const normalizada = resolve(ruta).replaceAll('\\', '/');
  return process.platform === 'win32' ? normalizada.toLowerCase() : normalizada;
}

function formatearModelo(valor) {
  if (!valor) return 'desconocido';
  try {
    const modelo = JSON.parse(valor);
    if (modelo?.providerID && modelo?.id) return `${modelo.providerID}/${modelo.id}`;
  } catch {
    // El campo también puede venir como texto plano.
  }
  return String(valor);
}

function estimarTokens(bytes) {
  return Math.ceil(bytes / 4);
}

function kilotokens(tokens) {
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k tokens`;
  return `${tokens} tokens`;
}

function kilobytes(bytes) {
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatearCoste(coste) {
  if (typeof coste !== 'number' || coste === 0) return '0 USD';
  return `${coste.toFixed(4)} USD`;
}

function fallar(mensaje) {
  console.error(`contexto: ${mensaje}`);
  process.exit(2);
}
