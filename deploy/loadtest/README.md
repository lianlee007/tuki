# Prueba de carga

`ai-gateway.js` usa [k6](https://k6.io) y golpea la misma ruta que el navegador
(`/api/v1/ai/chat`) a través de Nginx/Ingress, además de `/healthz`.

## Ejecutar

```bash
# k6 instalado
k6 run -e BASE_URL=http://localhost:8080 deploy/loadtest/ai-gateway.js

# o con Docker (Linux; en Docker Desktop usa host.docker.internal)
docker run --rm -i -e BASE_URL=http://host.docker.internal:8080 \
  grafana/k6 run - < deploy/loadtest/ai-gateway.js
```

## Qué mide

| Escenario | Carga | Umbral |
| --- | --- | --- |
| `health` | 5 VUs durante 30 s | 0 fallos, p95 < 300 ms |
| `chat` | 1 req/s durante 30 s (configurable con `CHAT_RPS`) | p95 < 10 s |

Si la cuota anónima está activa (por defecto 10/min), verás muchos `429`. Eso es
correcto: el test valida que el rate limit responde rápido y no tumba al
gateway. Para medir la latencia real de Groq, sube temporalmente las cuotas:

```bash
AI_RATE_LIMIT_ANON_PER_MINUTE=180 AI_RATE_LIMIT_ANON_BURST=60 \
  docker compose --env-file .env.local up -d ai-gateway
```

No uses este script contra producción con la clave real sin presupuesto: cada
petición consume tokens de Groq.
