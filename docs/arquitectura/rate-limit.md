# Rate limit y réplicas

Cómo se limita el abuso de la IA sin que la cuota dependa del número de pods.
Complementa el [ADR 0004](../adr/0004-rate-limit-en-memoria.md).

## 1. El problema en una frase

El gateway usa un **token bucket en memoria**. Con una réplica la cuota es
exacta; con N réplicas cada pod lleva su propia cuenta y la cuota efectiva se
multiplica por N. El HPA podía escalar el gateway a 20 pods: la cuota real
pasaba de 10 a 200 peticiones/minuto sin que nadie lo notara.

## 2. Decisión: tres capas, una sola cuota autoritativa

| Capa | Dónde | Cuota | Estado |
| --- | --- | --- | --- |
| Borde | Cloudflare `http_ratelimit` | 60/min por IP en `/api/*`, 20/min en `/api/chat` | **Autoritativa** |
| Ingress | nginx `limit_req` (opcional) | 120/min por IP | Defensa en profundidad |
| Pod | token bucket en memoria | 10/min anónimo, 30/min autenticado | Última barrera |

La cuota que se defiende ante el tribunal y la que protege la factura de Groq
es la de Cloudflare, porque es la única que ve todas las peticiones. Las otras
dos existen para que un fallo de configuración del edge no llegue a Groq.

## 3. Por qué el gateway corre con una réplica

`deploy/k8s/base/ai-gateway-deployment.yaml` fija `replicas: 1` y el HPA del
gateway **se retiró**. No es un olvido: es la única forma de que la cuota por
pod sea la cuota real mientras el contador viva en memoria.

- El gateway es un proxy de E/S: `httpx` asíncrono con 50 conexiones. Una
  réplica atiende con holgura el tráfico de un restaurante.
- La disponibilidad no depende de escalar: `readinessProbe`, PDB con
  `maxUnavailable: 1` y reinicio rápido cubren la caída del pod.
- El HPA de la **web** sí se mantiene (2–20 réplicas): Nginx es sin estado.

## 4. Cuándo y cómo volver a escalar

Solo tiene sentido si el limitador pasa a un almacén compartido. El camino
previsto, en orden:

1. **Redis gestionado** (p. ej. Upstash) o `redis` en el clúster con AOF.
2. Un adaptador `RedisRateLimiter` que implemente el mismo método `check` con
   un script Lua atómico (token bucket: `HMGET tokens,ts` → calcular → `HSET`).
   La interfaz de `RateLimiter` ya está pensada para sustituirse sin tocar
   rutas ni middleware.
3. Activar el HPA del gateway con `minReplicas: 2` y `maxReplicas: 10`.

Sin el paso 2, subir réplicas es un bug de facturación, no una mejora.

## 5. Ajustar la cuota

| Variable | Default | Cuándo cambiarla |
| --- | --- | --- |
| `AI_RATE_LIMIT_ANON_PER_MINUTE` | 10 | Si el carrito anónimo se bloquea con uso normal |
| `AI_RATE_LIMIT_ANON_BURST` | 4 | Ráfagas al abrir varias pestañas |
| `AI_RATE_LIMIT_AUTH_PER_MINUTE` | 30 | Dueños que generan mucho texto seguido |
| `AI_RATE_LIMIT_AUTH_BURST` | 8 | Ídem |

La alerta `TukiGatewayRateLimitAbuse` (>1 rechazo/s durante 10 min) avisa si la
cuota es demasiado baja o si hay abuso real. En Cloudflare, *Security → Events*
muestra qué regla `tuki-*` disparó.

## 6. Verificación

```bash
# Cuota del gateway (ráfaga de 12 peticiones anónimas)
for i in $(seq 1 12); do
  curl -s -o /dev/null -w '%{http_code} ' -X POST localhost:8001/chat \
    -H 'Content-Type: application/json' -d '{"mensaje":"hola"}'
done
# Esperado: 200/401... y luego 429 con Retry-After

# Una sola réplica en el clúster
kubectl -n tuki get deploy tuki-ai-gateway -o jsonpath='{.spec.replicas}'
kubectl -n tuki get hpa   # solo debe aparecer el de la web
```
