import http from 'k6/http';
import { check, sleep } from 'k6';

// Prueba de carga del AI Gateway a través de Nginx (misma ruta que el navegador).
//
//   k6 run -e BASE_URL=http://localhost:8081 deploy/loadtest/ai-gateway.js
//   docker run --rm -i --network host -e BASE_URL=http://localhost:8080 \
//     grafana/k6 run - < deploy/loadtest/ai-gateway.js
//
// Para medir latencia real de Groq, sube las cuotas del gateway o usa un
// usuario autenticado. Si no, la mayoría de respuestas serán 429 y el test
// seguirá siendo válido para comprobar que el rate limit protege el servicio.

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081';
const CHAT_RPS = Number(__ENV.CHAT_RPS || 1);

export const options = {
  scenarios: {
    health: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      exec: 'health',
      tags: { scenario: 'health' },
    },
    chat: {
      executor: 'constant-arrival-rate',
      rate: CHAT_RPS,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 5,
      maxVUs: 15,
      exec: 'chat',
      startTime: '5s',
      tags: { scenario: 'chat' },
    },
  },
  thresholds: {
    'http_req_failed{scenario:health}': ['rate<0.01'],
    'http_req_duration{scenario:health}': ['p(95)<300'],
    'http_req_duration{scenario:chat}': ['p(95)<10000'],
    checks: ['rate>0.95'],
  },
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function health() {
  const response = http.get(`${BASE_URL}/healthz`, {
    tags: { name: 'GET /healthz' },
  });
  check(response, {
    'healthz 200': (r) => r.status === 200,
  });
  sleep(0.2);
}

export function chat() {
  const response = http.post(
    `${BASE_URL}/api/v1/ai/chat`,
    JSON.stringify({
      prompt: 'Devuelve exactamente la palabra: hola',
      system: 'Responde solo con la palabra solicitada.',
    }),
    { headers: JSON_HEADERS, tags: { name: 'POST /api/v1/ai/chat' } },
  );

  check(response, {
    'chat responde 200 o 429 por cuota': (r) => r.status === 200 || r.status === 429,
  });
  sleep(1);
}

export default function () {
  health();
}
