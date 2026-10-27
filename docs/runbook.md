# Runbook de Riki

Guía de operación para la SPA y el AI Gateway. Los enlaces de las alertas de
`deploy/observability/prometheusrule.yaml` apuntan a las secciones de este
documento.

## Índice

- [SPA caída](#spa-caida)
- [Gateway caído](#gateway-caido)
- [Errores 5xx en el gateway](#errores-5xx-en-el-gateway)
- [Latencia alta](#latencia-alta)
- [Rate limit](#rate-limit)
- [Timeouts](#timeouts)
- [Nginx](#nginx)
- [Rotación de la clave de Groq](#rotacion-de-la-clave-de-groq)
- [Rotación de secretos de Supabase](#rotacion-de-secretos-de-supabase)
- [Rollback](#rollback)
- [ArgoCD fuera de sync](#argocd-fuera-de-sync)
- [Checklist de incidente](#checklist-de-incidente)

---

## SPA caída

**Alerta:** `RikiWebDown` (`up{namespace="riki",service="riki"} == 0`, 5 min).

1. Verificar pods y eventos:

   ```bash
   kubectl get pods -n riki -l app.kubernetes.io/name=riki -o wide
   kubectl describe pod -n riki -l app.kubernetes.io/name=riki
   kubectl get events -n riki --sort-by=.lastTimestamp | tail -20
   ```

2. Probar el pod sin pasar por Ingress:

   ```bash
   kubectl port-forward -n riki svc/riki 8081:80
   curl -i http://localhost:8081/healthz
   ```

3. Revisar logs de Nginx y del exporter:

   ```bash
   kubectl logs -n riki deploy/riki -c web --tail=100
   kubectl logs -n riki deploy/riki -c nginx-exporter --tail=50
   ```

4. Causas frecuentes:
   - `CreateContainerConfigError`: falta `imagePullSecrets` o el tag no existe.
   - `CrashLoopBackOff`: configuración de Nginx inválida; `kubectl logs` muestra
     `[emerg]`.
   - Probes fallando por `NetworkPolicy`: añadir entrada desde el CIDR de los
     nodos o desactivar la política en local.
   - `/healthz` responde pero el sitio no: revisar que `dist/` esté montado y
     que `try_files` apunte a `/index.html`.

5. Si el problema es la última release:

   ```bash
   kubectl rollout undo deployment/riki -n riki
   kubectl rollout status deployment/riki -n riki --timeout=180s
   ```

## Gateway caído

**Alerta:** `RikiGatewayDown` (`up{namespace="riki",service="ai-gateway"} == 0`).

La SPA sigue sirviendo; solo fallan las funciones de IA.

1. Estado y causa:

   ```bash
   kubectl get pods -n riki -l app.kubernetes.io/name=riki-ai-gateway -o wide
   kubectl describe pod -n riki -l app.kubernetes.io/name=riki-ai-gateway
   kubectl logs -n riki deploy/riki-ai-gateway --tail=120
   ```

2. Readiness (no liveness):

   ```bash
   kubectl port-forward -n riki svc/ai-gateway 8002:8000
   curl -i http://localhost:8002/readyz
   ```

   `503` significa que falta `GROQ_API_KEY`, el JWKS o que `SUPABASE_URL` es
   inválida. El proceso sigue vivo a propósito para no entrar en un bucle de
   reinicios por una mala configuración.

3. Verificar el secreto:

   ```bash
   kubectl get secret riki-ai-gateway -n riki
   kubectl get secret riki-ai-gateway -n riki \
     -o jsonpath='{.data.GROQ_API_KEY}' | base64 -d | wc -c
   ```

   No imprimas el valor en logs compartidos.

4. Configuración efectiva:

   ```bash
   kubectl get configmap ai-gateway-config -n riki -o yaml
   ```

5. Si el gateway no arranca tras un cambio de imagen, volver a la revisión
   anterior:

   ```bash
   kubectl rollout undo deployment/riki-ai-gateway -n riki
   ```

## Errores 5xx en el gateway

**Alerta:** `RikiGatewayErrorRate` (>5 % de 5xx durante 10 min).

1. Identificar el código y la ruta:

   ```bash
   kubectl logs -n riki deploy/riki-ai-gateway --tail=200 \
     | ConvertFrom-Json | Where-Object { $_.status -ge 500 }
   ```

   En Linux/macOS:

   ```bash
   kubectl logs -n riki deploy/riki-ai-gateway --tail=200 | jq 'select(.status >= 500)'
   ```

2. Buscar `code` en los logs:

   | `code` | Significado | Acción |
   | --- | --- | --- |
   | `upstream_error` | Groq devolvió error no reintentable | Revisar estado de Groq y el modelo |
   | `upstream_timeout` | Se agotó el presupuesto total | Ver [Timeouts](#timeouts) |
   | `auth_unavailable` | JWKS de Supabase inaccesible | Revisar egreso 443 y Supabase |
   | `internal_error` | Excepción no controlada | Abrir issue con `request_id` |
   | `invalid_response` | Groq devolvió JSON inesperado | Revisar modelo/versión |

3. Correlacionar con `request_id` del cliente (`X-Request-Id`).

4. Si el fallback entre modelos está fallando, probar el modelo por defecto:

   ```bash
   curl -s http://localhost:8002/api/v1/ai/models
   ```

## Latencia alta

**Alerta:** `RikiGatewayLatencyHigh` (p95 > 10 s durante 10 min).

1. Separar latencia propia de la de Groq:

   ```promql
   histogram_quantile(0.95,
     sum by (le) (rate(ai_gateway_http_request_duration_seconds_bucket[5m])))
   histogram_quantile(0.95,
     sum by (le) (rate(ai_gateway_upstream_duration_seconds_bucket[5m])))
   ```

2. Revisar CPU/memoria y reinicios:

   ```bash
   kubectl top pods -n riki
   kubectl get pods -n riki -l app.kubernetes.io/name=riki-ai-gateway
   ```

3. Si el HPA no escala, confirmar `metrics-server`:

   ```bash
   kubectl get hpa -n riki
   ```

4. Ajustes temporales:
   - Bajar `AI_GROQ_TOTAL_TIMEOUT_SECONDS` para cortar antes.
   - Reducir `AI_GROQ_MAX_ATTEMPTS` si el fallback multiplica la latencia.
   - Aumentar réplicas del gateway manualmente mientras se investiga.

5. Si el problema es un modelo concreto, quitarlo de `AI_GROQ_MODELS` y
   reiniciar el Deployment.

## Rate limit

**Alerta:** `RikiGatewayRateLimitAbuse` (>1 rechazo/s durante 10 min).

1. Ver la distribución por identidad:

   ```promql
   sum by (identity_type) (rate(ai_gateway_rate_limited_total[5m]))
   ```

2. Distinguir abuso de cuota baja:
   - Muchos `anon` y pocos `user`: posible bot o tráfico de una IP.
   - Muchos `user`: la cuota autenticada es insuficiente para el uso real.

3. Revisar IPs en logs (el gateway no registra el texto del prompt):

   ```bash
   kubectl logs -n riki deploy/riki-ai-gateway --tail=200 | jq 'select(.event=="http_request" and .status==429)'
   ```

4. Ajustar cuotas en el ConfigMap y reiniciar:

   ```bash
   kubectl edit configmap ai-gateway-config -n riki
   kubectl rollout restart deployment/riki-ai-gateway -n riki
   ```

5. Si el abuso es sostenido, bloquear en el Ingress o en el WAF. El rate limit
   en memoria es por pod; con 2 réplicas la cuota efectiva se duplica (ADR 0004).

## Timeouts

**Alerta:** `RikiGatewayTimeouts` (>0,2 timeouts/s durante 10 min).

1. Confirmar que son 504 del gateway y no del Ingress:

   ```promql
   sum(rate(ai_gateway_http_requests_total{status="504"}[5m]))
   ```

2. Revisar la configuración efectiva:

   ```bash
   kubectl get configmap ai-gateway-config -n riki -o jsonpath='{.data}'
   ```

3. Orden de timeouts (debe ser creciente):

   `AI_GROQ_TIMEOUT_SECONDS` < `AI_GROQ_TOTAL_TIMEOUT_SECONDS` < timeout de
   Nginx/Ingress (`proxy-read-timeout`).

4. Si Groq está degradado, el fallback ya intenta otros modelos. Si todos
   fallan, el gateway devuelve `504` y el frontend muestra un error genérico.

5. No aumentar el timeout sin límite: cada petición ocupa un worker y consume
   presupuesto. Es preferible bajar `AI_GROQ_MAX_ATTEMPTS` y avisar al usuario.

## Nginx

**Alerta:** `RikiNginxConnectionsHigh` (>800 conexiones activas durante 10 min).

1. Ver conexiones y requests:

   ```promql
   sum(nginx_connections_active{namespace="riki"})
   sum(rate(nginx_http_requests_total{namespace="riki"}[5m]))
   ```

2. Revisar límites del pod y del HPA. Si el HPA no escala, falta
   `metrics-server`.

3. Buscar tráfico anómalo en logs de Nginx (el gateway también loguea JSON).

4. Ajustar `worker_connections` en `docker/nginx/nginx.conf` solo si el límite
   real del sistema lo permite; el cuello de botella suele ser CPU o el gateway.

## Rotación de la clave de Groq

1. Crear una clave nueva en <https://console.groq.com>.
2. Actualizar el secreto **sin reiniciar todo el clúster**:

   ```bash
   kubectl create secret generic riki-ai-gateway \
     --from-literal=GROQ_API_KEY="$GROQ_API_KEY_NUEVA" \
     -n riki --dry-run=client -o yaml | kubectl apply -f -
   kubectl rollout restart deployment/riki-ai-gateway -n riki
   kubectl rollout status deployment/riki-ai-gateway -n riki
   ```

3. Verificar `readyz` y una petición real.
4. Revocar la clave anterior en Groq.
5. En local, actualizar `.env.local`; nunca lo confirmes en Git.

## Rotación de secretos de Supabase

- La `anon key` es pública por diseño y viaja en el bundle. Rotarla exige
  reconstruir y republicar la imagen web.
- El gateway no usa la `anon key`: valida JWT con el JWKS público del proyecto.
- Si cambia la URL o el proyecto, actualiza `SUPABASE_URL` en el ConfigMap de
  producción y reinicia el gateway.
- Si Supabase rota sus claves de firma, el gateway las descubre por JWKS; puede
  tardar hasta `AI_JWKS_CACHE_SECONDS` (600 s por defecto).

## Rollback

### Kubernetes

```bash
kubectl rollout history deployment/riki -n riki
kubectl rollout undo deployment/riki -n riki
kubectl rollout undo deployment/riki-ai-gateway -n riki
kubectl rollout status deployment/riki -n riki
```

### ArgoCD

```bash
argocd app history riki-production
argocd app rollback riki-production <ID>
argocd app get riki-production
```

### Imagen concreta

```bash
kubectl set image deployment/riki web=ghcr.io/leonardo007x/leefood:<tag> -n riki
kubectl set image deployment/riki-ai-gateway \
  gateway=ghcr.io/leonardo007x/riki-ai-gateway:<tag> -n riki
```

Después de un rollback, verifica:

```bash
curl -fsS https://<dominio>/healthz
curl -fsS https://<dominio>/api/readyz
```

## ArgoCD fuera de sync

1. Ver el diff:

   ```bash
   argocd app diff riki-production
   ```

2. Causas frecuentes:
   - El HPA cambió `replicas` (debe estar en `ignoreDifferences`).
   - Un secreto se creó fuera de Git.
   - Una imagen cambió de tag sin commit.

3. Si el cambio es legítimo, hazlo en Git; no edites el clúster a mano.
4. Si hay que forzar:

   ```bash
   argocd app sync riki-production --prune
   ```

## Checklist de incidente

- [ ] ¿Afecta a la SPA, a la IA o a ambos?
- [ ] ¿Qué alerta se disparó y desde cuándo?
- [ ] ¿Hay un despliegue reciente? (`kubectl rollout history`)
- [ ] ¿Los pods están Ready? ¿Por qué no?
- [ ] ¿El secreto existe y tiene la clave correcta?
- [ ] ¿Supabase y Groq están operativos?
- [ ] ¿Hay abuso o un pico de tráfico?
- [ ] ¿Se puede mitigar con rollback, cuota o timeout?
- [ ] ¿Se registró el `request_id` y la hora?
- [ ] ¿Se actualizó el incidente y se documentó la causa raíz?
