# Runbook de Tuki

Guía de operación para la SPA y el AI Gateway. Los enlaces de las alertas de
`deploy/observability/prometheusrule.yaml` apuntan a las secciones de este
documento.

> El despliegue real en el VPS compartido no corre en Kubernetes: vive en
> Dokploy. Su topología, variables, dominio y diagnóstico están en
> [`plataforma/despliegue-dokploy.md`](plataforma/despliegue-dokploy.md).

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
- [CI en rojo](#ci-en-rojo)
- [Rollback](#rollback)
- [ArgoCD fuera de sync](#argocd-fuera-de-sync)
- [Checklist de incidente](#checklist-de-incidente)

---

## SPA caída

**Alerta:** `TukiWebDown` (`up{namespace="tuki",service="tuki"} == 0`, 5 min).

1. Verificar pods y eventos:

   ```bash
   kubectl get pods -n tuki -l app.kubernetes.io/name=tuki -o wide
   kubectl describe pod -n tuki -l app.kubernetes.io/name=tuki
   kubectl get events -n tuki --sort-by=.lastTimestamp | tail -20
   ```

2. Probar el pod sin pasar por Ingress:

   ```bash
   kubectl port-forward -n tuki svc/tuki 8081:80
   curl -i http://localhost:8081/healthz
   ```

3. Revisar logs de Nginx y del exporter:

   ```bash
   kubectl logs -n tuki deploy/tuki -c web --tail=100
   kubectl logs -n tuki deploy/tuki -c nginx-exporter --tail=50
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
   kubectl rollout undo deployment/tuki -n tuki
   kubectl rollout status deployment/tuki -n tuki --timeout=180s
   ```

## Gateway caído

**Alerta:** `TukiGatewayDown` (`up{namespace="tuki",service="backend"} == 0`).

La SPA sigue sirviendo; solo fallan las funciones de IA.

1. Estado y causa:

   ```bash
   kubectl get pods -n tuki -l app.kubernetes.io/name=tuki-ai-gateway -o wide
   kubectl describe pod -n tuki -l app.kubernetes.io/name=tuki-ai-gateway
   kubectl logs -n tuki deploy/tuki-ai-gateway --tail=120
   ```

2. Readiness (no liveness):

   ```bash
   kubectl port-forward -n tuki svc/backend 8002:8000
   curl -i http://localhost:8002/readyz
   ```

   `503` significa que falta `GROQ_API_KEY`, el JWKS o que `SUPABASE_URL` es
   inválida. El proceso sigue vivo a propósito para no entrar en un bucle de
   reinicios por una mala configuración.

3. Verificar el secreto:

   ```bash
   kubectl get secret tuki-ai-gateway -n tuki
   kubectl get secret tuki-ai-gateway -n tuki \
     -o jsonpath='{.data.GROQ_API_KEY}' | base64 -d | wc -c
   ```

   No imprimas el valor en logs compartidos.

4. Configuración efectiva:

   ```bash
   kubectl get configmap ai-gateway-config -n tuki -o yaml
   ```

5. Si el gateway no arranca tras un cambio de imagen, volver a la revisión
   anterior:

   ```bash
   kubectl rollout undo deployment/tuki-ai-gateway -n tuki
   ```

## Errores 5xx en el gateway

**Alerta:** `TukiGatewayErrorRate` (>5 % de 5xx durante 10 min).

1. Identificar el código y la ruta:

   ```bash
   kubectl logs -n tuki deploy/tuki-ai-gateway --tail=200 \
     | ConvertFrom-Json | Where-Object { $_.status -ge 500 }
   ```

   En Linux/macOS:

   ```bash
   kubectl logs -n tuki deploy/tuki-ai-gateway --tail=200 | jq 'select(.status >= 500)'
   ```

2. Buscar `code` en los logs:

   | `code` | Significado | Acción |
   | --- | --- | --- |
   | `upstream_error` | Groq devolvió error no reintentable | Revisar estado de Groq y el modelo |
   | `upstream_timeout` | Se agotó el presupuesto total | Ver [Timeouts](#timeouts) |
   | `auth_unavailable` | Supabase inaccesible (JWKS o GoTrue) | Revisar egreso 443, Supabase y `SUPABASE_ANON_KEY` |
   | `internal_error` | Excepción no controlada | Abrir issue con `request_id` |
   | `invalid_response` | Groq devolvió JSON inesperado | Revisar modelo/versión |

3. Correlacionar con `request_id` del cliente (`X-Request-Id`).

4. Si el fallback entre modelos está fallando, probar el modelo por defecto:

   ```bash
   curl -s http://localhost:8002/api/v1/ai/models
   ```

## Latencia alta

**Alerta:** `TukiGatewayLatencyHigh` (p95 > 10 s durante 10 min).

1. Separar latencia propia de la de Groq:

   ```promql
   histogram_quantile(0.95,
     sum by (le) (rate(ai_gateway_http_request_duration_seconds_bucket[5m])))
   histogram_quantile(0.95,
     sum by (le) (rate(ai_gateway_upstream_duration_seconds_bucket[5m])))
   ```

2. Revisar CPU/memoria y reinicios:

   ```bash
   kubectl top pods -n tuki
   kubectl get pods -n tuki -l app.kubernetes.io/name=tuki-ai-gateway
   ```

3. Si el HPA no escala, confirmar `metrics-server`:

   ```bash
   kubectl get hpa -n tuki
   ```

4. Ajustes temporales:
   - Bajar `AI_GROQ_TOTAL_TIMEOUT_SECONDS` para cortar antes.
   - Reducir `AI_GROQ_MAX_ATTEMPTS` si el fallback multiplica la latencia.
   - Aumentar réplicas del gateway manualmente mientras se investiga.

5. Si el problema es un modelo concreto, quitarlo de `AI_GROQ_MODELS` y
   reiniciar el Deployment.

## Rate limit

**Alerta:** `TukiGatewayRateLimitAbuse` (>1 rechazo/s durante 10 min).

1. Ver la distribución por identidad:

   ```promql
   sum by (identity_type) (rate(ai_gateway_rate_limited_total[5m]))
   ```

2. Distinguir abuso de cuota baja:
   - Muchos `anon` y pocos `user`: posible bot o tráfico de una IP.
   - Muchos `user`: la cuota autenticada es insuficiente para el uso real.

3. Revisar IPs en logs (el gateway no registra el texto del prompt):

   ```bash
   kubectl logs -n tuki deploy/tuki-ai-gateway --tail=200 | jq 'select(.event=="http_request" and .status==429)'
   ```

4. Ajustar cuotas en el ConfigMap y reiniciar:

   ```bash
   kubectl edit configmap ai-gateway-config -n tuki
   kubectl rollout restart deployment/tuki-ai-gateway -n tuki
   ```

5. Si el abuso es sostenido, bloquear en el Ingress o en el WAF. El rate limit
   en memoria es por pod; con 2 réplicas la cuota efectiva se duplica (ADR 0004).

## Timeouts

**Alerta:** `TukiGatewayTimeouts` (>0,2 timeouts/s durante 10 min).

1. Confirmar que son 504 del gateway y no del Ingress:

   ```promql
   sum(rate(ai_gateway_http_requests_total{status="504"}[5m]))
   ```

2. Revisar la configuración efectiva:

   ```bash
   kubectl get configmap ai-gateway-config -n tuki -o jsonpath='{.data}'
   ```

3. Orden de timeouts (debe ser creciente):

   `AI_GROQ_TIMEOUT_SECONDS` < `AI_GROQ_TOTAL_TIMEOUT_SECONDS` < timeout de
   Nginx/Ingress (`proxy-read-timeout`).

4. Si Groq está degradado, el fallback ya intenta otros modelos. Si todos
   fallan, el gateway devuelve `504` y el frontend muestra un error genérico.

5. No aumentar el timeout sin límite: cada petición ocupa un worker y consume
   presupuesto. Es preferible bajar `AI_GROQ_MAX_ATTEMPTS` y avisar al usuario.

## Nginx

**Alerta:** `TukiNginxConnectionsHigh` (>800 conexiones activas durante 10 min).

1. Ver conexiones y requests:

   ```promql
   sum(nginx_connections_active{namespace="tuki"})
   sum(rate(nginx_http_requests_total{namespace="tuki"}[5m]))
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
   kubectl create secret generic tuki-ai-gateway \
     --from-literal=GROQ_API_KEY="$GROQ_API_KEY_NUEVA" \
     -n tuki --dry-run=client -o yaml | kubectl apply -f -
   kubectl rollout restart deployment/tuki-ai-gateway -n tuki
   kubectl rollout status deployment/tuki-ai-gateway -n tuki
   ```

3. Verificar `readyz` y una petición real.
4. Revocar la clave anterior en Groq.
5. En local, actualizar `.env.local`; nunca lo confirmes en Git.

## Rotación de secretos de Supabase

- La `anon key` es pública por diseño y viaja en el bundle. Rotarla exige
  reconstruir y republicar la imagen web y actualizar `SUPABASE_ANON_KEY` en el
  gateway.
- El gateway valida los JWT con el JWKS público del proyecto. En proyectos
  antiguos, que firman con HS256, ese JWKS está vacío: el token se comprueba
  contra `GET /auth/v1/user` de Supabase con la `anon key` y se cachea 60 s
  (`AI_LEGACY_TOKEN_CACHE_SECONDS`). Si falta `SUPABASE_ANON_KEY`, el gateway
  responde `503 auth_unavailable` en vez de aceptar el token sin comprobarlo.
- Si cambia la URL o el proyecto, actualiza `SUPABASE_URL` en el ConfigMap de
  producción y reinicia el gateway.
- Si Supabase rota sus claves de firma, el gateway las descubre por JWKS; puede
  tardar hasta `AI_JWKS_CACHE_SECONDS` (600 s por defecto).

## CI en rojo

Los tres workflows viven en `.github/workflows/`. Antes de tocar código, mira
**qué job** falló: casi siempre el problema está en la configuración del
repositorio, no en la aplicación.

```bash
gh run list --limit 10
gh run view <run-id> --log-failed
```

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `Web · imagen…` falla en `Construir y publicar` con `ERROR: faltan variables de compilación: VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY` | Faltan los secretos de Actions; el Dockerfile falla a propósito para no publicar un bundle sin Supabase | `gh secret set VITE_SUPABASE_URL` y `gh secret set VITE_SUPABASE_ANON_KEY` (valores de `.env.local`); volver a lanzar el workflow |
| `E2E · flujo del comensal` falla con `getByRole('link', { name: 'Bandeja paisa…' })` y `element(s) not found` | El build de E2E quedó sin Supabase por los mismos secretos ausentes, así que la búsqueda no devuelve platos | Mismo arreglo que la fila anterior |
| `Subir resultados a code scanning` responde `Resource not accessible by integration` | El repositorio es privado y no tiene GitHub Advanced Security | Ya no bloquea: el SARIF se publica como artefacto y el gate real es el `exit-code` de Trivy. Si algún día se habilita GHAS, el paso vuelve a funcionar solo |
| `Trivy · imagen publicada` termina con `exit code 1` sin tabla de hallazgos | El formato `sarif` no imprime la tabla; hay una vulnerabilidad `HIGH`/`CRITICAL` corregible en la base o en una dependencia (o un falso positivo temporal de la base de datos) | Ver el artefacto `trivy-*.sarif` del run, actualizar la imagen base o la dependencia y relanzar. Si es un falso positivo, esperar la actualización de la base de Trivy |
| `actionlint` o `shellcheck` fallan sin tocar la app | Workflow o script inválido | `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:latest` y `koalaman/shellcheck:stable deploy/scripts/*.sh` en local |

Antes de hacer push, la misma puerta corre en local con `pnpm verificar`
(tipos, lint, pruebas, build, gateway y manifiestos).

## Rollback

### Kubernetes

```bash
kubectl rollout history deployment/tuki -n tuki
kubectl rollout undo deployment/tuki -n tuki
kubectl rollout undo deployment/tuki-ai-gateway -n tuki
kubectl rollout status deployment/tuki -n tuki
```

### ArgoCD

```bash
argocd app history tuki-production
argocd app rollback tuki-production <ID>
argocd app get tuki-production
```

### Imagen concreta

```bash
kubectl set image deployment/tuki web=ghcr.io/lianlee007/tuki:<tag> -n tuki
kubectl set image deployment/tuki-ai-gateway \
  gateway=ghcr.io/lianlee007/tuki-ai-gateway:<tag> -n tuki
```

Después de un rollback, verifica:

```bash
curl -fsS https://<dominio>/healthz
curl -fsS https://<dominio>/api/readyz
```

## ArgoCD fuera de sync

1. Ver el diff:

   ```bash
   argocd app diff tuki-production
   ```

2. Causas frecuentes:
   - El HPA cambió `replicas` (debe estar en `ignoreDifferences`).
   - Un secreto se creó fuera de Git.
   - Una imagen cambió de tag sin commit.

3. Si el cambio es legítimo, hazlo en Git; no edites el clúster a mano.
4. Si hay que forzar:

   ```bash
   argocd app sync tuki-production --prune
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
