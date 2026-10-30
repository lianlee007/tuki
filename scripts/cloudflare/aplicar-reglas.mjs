#!/usr/bin/env node
/**
 * Aplica las reglas de WAF, rate limit y caché a una zona de Cloudflare.
 *
 * Lee `deploy/cloudflare/waf-reglas.json` y `cache-reglas.json`, busca la
 * ruleset de cada fase y reemplaza **solo** las reglas cuyo `description`
 * empieza por `tuki-`. Las reglas propias del dashboard quedan intactas.
 *
 * Requisitos:
 *   CLOUDFLARE_API_TOKEN  con Zone → Rulesets → Edit
 *   CLOUDFLARE_ZONE_ID
 *
 * Uso:
 *   node scripts/cloudflare/aplicar-reglas.mjs --dry-run
 *   node scripts/cloudflare/aplicar-reglas.mjs
 */
import { readFileSync } from 'node:fs';

const API = 'https://api.cloudflare.com/client/v4';
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE = process.env.CLOUDFLARE_ZONE_ID;
const DRY_RUN = process.argv.includes('--dry-run');
const PREFIJO = 'tuki-';

if (!DRY_RUN && (!TOKEN || !ZONE)) {
  console.error('Faltan CLOUDFLARE_API_TOKEN o CLOUDFLARE_ZONE_ID.');
  process.exit(1);
}

const llamar = async (ruta, init = {}) => {
  const respuesta = await fetch(`${API}${ruta}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok || !cuerpo.success) {
    throw new Error(`${init.method || 'GET'} ${ruta}: ${JSON.stringify(cuerpo.errors || cuerpo)}`);
  }
  return cuerpo.result;
};

const esDeTuki = (regla) => String(regla.description || '').startsWith(PREFIJO);

const fusionar = (existentes, nuevas) => [
  ...(existentes || []).filter((regla) => !esDeTuki(regla)),
  ...nuevas,
];

const aplicarFase = async ({ fase, reglas }) => {
  const ruta = `/zones/${ZONE}/rulesets/phases/${fase}/entrypoint`;

  if (DRY_RUN) {
    console.log(`\n[dry-run] ${fase}: ${reglas.length} reglas tuki-*`);
    for (const regla of reglas) console.log(`  - ${regla.description} (${regla.action})`);
    return;
  }

  let actual = null;
  try {
    actual = await llamar(ruta);
  } catch (error) {
    if (!String(error.message).includes('not found')) throw error;
  }

  const cuerpo = {
    rules: fusionar(actual?.rules, reglas).map(({ _comentario, ...regla }) => regla),
  };

  if (actual) {
    await llamar(`/zones/${ZONE}/rulesets/${actual.id}`, {
      method: 'PUT',
      body: JSON.stringify(cuerpo),
    });
    console.log(`Actualizada ${fase} (${actual.id})`);
  } else {
    const creada = await llamar(`/zones/${ZONE}/rulesets`, {
      method: 'POST',
      body: JSON.stringify({ name: `tuki-${fase}`, kind: 'zone', phase: fase, ...cuerpo }),
    });
    console.log(`Creada ${fase} (${creada.id})`);
  }
};

const main = async () => {
  const waf = JSON.parse(readFileSync('deploy/cloudflare/waf-reglas.json', 'utf8'));
  const cache = JSON.parse(readFileSync('deploy/cloudflare/cache-reglas.json', 'utf8'));

  await aplicarFase({ fase: waf.fase, reglas: waf.reglas });
  await aplicarFase({ fase: waf.rate_limit.fase, reglas: waf.rate_limit.reglas });
  await aplicarFase({ fase: cache.fase, reglas: cache.reglas });
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
