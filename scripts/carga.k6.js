/**
 * Prueba de carga de los endpoints públicos de TukiTuki.
 *
 * Uso:
 *   k6 run -e BASE_URL=http://localhost:3002 scripts/carga.k6.js
 *
 * Los endpoints de escritura no se incluyen: la prueba mide el camino de
 * lectura que recibe el comensal (descubrir, ficha pública y menú), que es el
 * que más tráfico soporta en la demo.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:3002';

export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '40s', target: 50 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const listado = http.get(`${BASE}/v1/restaurantes`);
  check(listado, {
    'listado responde 200': (r) => r.status === 200,
  });

  const platos = http.get(`${BASE}/v1/restaurantes/platos`);
  check(platos, {
    'platos responde 200': (r) => r.status === 200,
  });

  const ficha = http.get(`${BASE}/v1/restaurantes/cafe-bolivar`);
  check(ficha, {
    'ficha responde 200': (r) => r.status === 200,
  });

  sleep(1);
}
