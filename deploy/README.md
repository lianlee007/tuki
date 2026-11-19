# Despliegue de Tuki con Docker y Kubernetes

Guía operativa del empaquetado profesional de Tuki: SPA servida por Nginx,
AI Gateway en FastAPI, observabilidad, GitOps con ArgoCD y cadena de suministro
verificable (Fases 0 y 1 del trabajo CloudForge AI).

El objetivo es **no cambiar el producto**: la SPA, sus rutas, Supabase y
Supabase Storage siguen funcionando igual. El único cambio funcional autorizado es que
la IA del navegador llama a `/api/v1/ai/chat` en lugar de ir directo a Groq con
una clave expuesta.

---

## 1. Arquitectura

```
Navegador
  │  HTTPS
  ├──────────────► Supabase Auth / Postgres      (servicio gestionado)
  ├──────────────► Supabase Storage              (servicio gestionado)
  │
  ▼
Ingress (ingress-nginx + cert-manager)
  │  /            → Service tuki        → Pods Nginx UID 101 :8080
  │  /api         → Service backend     → Pods FastAPI UID 10001 :8000
  │
  └─ Nginx /api/ ──► backend:8000 ──► api.groq.com:443
                                   └► Supabase JWKS:443

     Nginx /vision/ ──► vision:8000 ──► Ultralytics (en el pod, sin salida)
```

Tres contenedores propios:

| Servicio | Imagen | Responsabilidad |
| --- | --- | --- |
| `frontend` | `ghcr.io/lianlee007/tuki` | Sirve `dist/` de Vite y hace de proxy `/api` y `/vision` |
| `backend` | `ghcr.io/lianlee007/tuki-ai-gateway` | AI Gateway: auth Supabase, cuotas, reintentos y llamada a Groq |
| `vision` | `ghcr.io/lianlee007/tuki-vision` | Clasificador local (Ultralytics) comida / no comida |

Los nombres de servicio son `frontend` y `backend`; el nombre del componente y
de la imagen del gateway (`tuki-ai-gateway`) se mantiene para no romper la
cadena de suministro ni los despliegues existentes.

Decisiones clave:

- **Mismo origen.** El frontend usa `VITE_AI_GATEWAY_URL=/api`. En desarrollo lo
  proxya Vite, en Compose/K8s local Nginx y en producción el Ingress. No hay
  CORS ni cookies de terceros.
- **La clave de Groq vive solo en el servidor.** Se eliminó
  `VITE_GROQ_API_KEY`; el bundle ya no contiene `gsk_...` ni `api.groq.com`.
- **La IA pública sigue disponible.** El carrito anónimo puede corregir texto
  con una cuota por IP; los usuarios autenticados tienen una cuota mayor. Un
  token inválido devuelve `401`, nunca se degrada a anónimo.
- **Servicios gestionados fuera del clúster.** Supabase (Postgres, Auth, Storage) y Groq Cloud
  no se containerizan (ver `docs/adr/0003-servicios-gestionados.md`).
- **La visión es local.** `vision` carga los pesos desde su propia imagen, no
  llama a Internet y solo acepta tráfico del pod web (NetworkPolicy). Si no
  está listo, el panel permite subir la foto igual.

---

## 2. Archivos incluidos

```
Dockerfile                                  Imagen web multi-etapa (Node → Nginx)
docker-compose.yml                          Stack local frontend + backend
docker/nginx/                               Configuración de Nginx y cabeceras
services/ai-gateway/                        Código, Dockerfile, tests y lockfiles
services/vision-service/                    Clasificador Ultralytics, dataset y pesos
deploy/k8s/base/                            Manifiestos comunes
deploy/k8s/overlays/local/                  Docker Desktop / kind / k3d
deploy/k8s/overlays/production/             Dominio, TLS, réplicas y auth Supabase
deploy/observability/                       ServiceMonitors, alertas y dashboard
deploy/argocd/                              Applications GitOps
deploy/policies/                            Políticas conftest (Rego)
deploy/scripts/                             Validación local de K8s y supply chain
deploy/loadtest/                            Prueba de carga k6
deploy/kind/                                Clúster local reproducible con kind
.github/workflows/contenedor.yml            CI: tests, escaneo, SBOM y firma
docs/adr/                                   Decisiones de arquitectura
docs/runbook.md                             Operación, incidentes y rollback
docs/modulos-1-3.md                         Matriz de cumplimiento CloudForge AI
docs/security/                              Modelo de amenazas y bitácora de hallazgos
docs/plataforma/                            Catálogo Backstage y golden path
catalog-info.yaml                           Catálogo mínimo de Backstage
```

---

## 3. Requisitos

- Docker Engine 24+ con BuildKit.
- Docker Compose v2.
- `kubectl` 1.27+ y, para el overlay de producción:
  - `ingress-nginx`
  - `metrics-server` (HPA)
  - `cert-manager` (TLS)
  - CNI con soporte de `NetworkPolicy`
  - Prometheus Operator + Grafana (observabilidad opcional)
- `uv` solo si vas a recompilar los lockfiles del gateway.
- Para firmar imágenes: Cosign y acceso a GHCR.
- En Windows, los scripts de `deploy/scripts/` se ejecutan con Git Bash
  (`C:\Program Files\Git\bin\bash.exe`); el WSL sin distribución no sirve.
  La puerta de calidad del repositorio es `pnpm verificar`.

---

## 4. Variables de entorno

### 4.1 Build-time (se incrustan en el bundle)

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sí | Clave anónima (pública por diseño) |
| `VITE_AI_GATEWAY_URL` | No | Prefijo del gateway; por defecto `/api` |
| `VITE_VISION_URL` | No | Prefijo del revisor de fotos; por defecto `/vision` |

`VITE_*` se resuelve al compilar: cambiar una exige reconstruir la imagen. El
build falla si falta una obligatoria.

### 4.2 Runtime del gateway

| Variable | Defecto | Uso |
| --- | --- | --- |
| `GROQ_API_KEY` | — | Secreto; obligatorio para generar texto |
| `SUPABASE_URL` | — | Obligatorio con `AI_AUTH_MODE=supabase` (JWKS e issuer) |
| `AI_AUTH_MODE` | `supabase` | `disabled` (solo local) o `supabase` |
| `AI_ALLOW_ANON` | `true` | Permite tráfico anónimo con cuota por IP |
| `AI_ENVIRONMENT` | `development` | `production` desactiva `/docs` y prohíbe `disabled` |
| `AI_GROQ_MODELS` | `openai/gpt-oss-120b,...` | Orden de fallback |
| `AI_GROQ_TIMEOUT_SECONDS` | `25` | Timeout por intento |
| `AI_GROQ_TOTAL_TIMEOUT_SECONDS` | `40` | Presupuesto total de la petición |
| `AI_RATE_LIMIT_ANON_PER_MINUTE` | `10` | Cuota anónima |
| `AI_RATE_LIMIT_ANON_BURST` | `4` | Ráfaga anónima |
| `AI_RATE_LIMIT_AUTH_PER_MINUTE` | `30` | Cuota autenticada |
| `AI_RATE_LIMIT_AUTH_BURST` | `8` | Ráfaga autenticada |
| `AI_LOG_LEVEL` | `INFO` | Nivel de logs JSON |
| `AI_CORS_ORIGINS` | vacío | Solo si el gateway vive en otro origen |
| `AI_OTEL_ENABLED` | `false` | Trazas OTel (imagen con `--build-arg WITH_OTEL=true` o `AI_WITH_OTEL=true` en Compose) |

Plantillas: `.env.example` (raíz), `services/ai-gateway/.env.example` y
`services/vision-service/.env.example`.

### 4.3 Runtime de visión

| Variable | Defecto | Uso |
| --- | --- | --- |
| `VISION_MODEL_PATH` | `/app/modelos/comida-v1.pt` | Pesos de Ultralytics (van en la imagen) |
| `VISION_UMBRAL_COMIDA` | `0.3` | Probabilidad mínima de comida para aceptar |
| `VISION_ETIQUETA_COMIDA` | `comida` | Clase positiva del modelo |
| `VISION_IMGSZ` | `224` | Resolución de inferencia |
| `VISION_DEVICE` | `cpu` | `cpu` o el id de una GPU |
| `VISION_MAX_IMAGEN_BYTES` | `8388608` | Tope de la foto (8 MB) |

Si el modelo no existe, el pod arranca pero `/readyz` devuelve `503` y el panel
sigue permitiendo subir fotos.

> **Nunca** subas `.env.local`, secretos de Kubernetes ni claves a Git. El
> `.dockerignore` excluye `.env*` del contexto de build.

---

## 5. Docker Compose

```bash
cp .env.example .env.local        # rellena Supabase y GROQ_API_KEY
docker compose --env-file .env.local up -d --build

docker compose --env-file .env.local ps
docker compose --env-file .env.local logs -f frontend backend
```

Servicios:

- **frontend** en <http://localhost:8080>, rootfs `read_only`, `cap_drop: ALL`,
  usuario `101:101`, límites de CPU/memoria y logs rotados.
- **backend** accesible solo en `127.0.0.1:8001`, usuario `10001:10001`,
  también con rootfs de solo lectura y `/tmp` efímero.
- **vision** accesible solo en `127.0.0.1:8002`, usuario `10001:10001`, límite
  de 1 CPU y 1 GB. El modelo se carga al arrancar y `start_period` es de 60 s.

Comprobaciones:

```bash
curl http://localhost:8080/healthz                    # ok
curl http://localhost:8080/api/healthz                # gateway vía Nginx
curl http://localhost:8080/api/readyz                 # incluye GROQ_API_KEY
curl http://localhost:8080/api/v1/ai/models
curl http://localhost:8080/vision/api/healthz         # visión vía Nginx
curl http://localhost:8080/vision/api/readyz          # 503 si falta el modelo
curl -X POST http://localhost:8080/vision/api/v1/vision/clasificar \
  -F "imagen=@plato.jpg"
curl -s http://localhost:8080/api/v1/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Devuelve exactamente: hola"}'
```

El gateway no arranca si `AI_AUTH_MODE=disabled` y `AI_ENVIRONMENT=production`,
ni si `SUPABASE_URL` conserva el placeholder `TU_PROYECTO`.

### 5.1 Build manual de la web

```bash
docker build \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  --build-arg VITE_AI_GATEWAY_URL=/api \
  -t ghcr.io/lianlee007/tuki:0.1.0 .
```

La imagen web **no** acepta `GROQ_API_KEY`: si aparece una variable así en el
contexto, es un error de configuración, no una feature.

### 5.2 Build manual del gateway

```bash
docker build \
  --build-arg VERSION=0.1.0 \
  --build-arg REVISION="$(git rev-parse --short HEAD)" \
  -t ghcr.io/lianlee007/tuki-ai-gateway:0.1.0 \
  services/ai-gateway
```

---

## 6. AI Gateway

### 6.1 Endpoints

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/v1/ai/chat` | JWT opcional | Genera texto |
| `GET` | `/api/v1/ai/models` | JWT opcional | Modelos y modelo por defecto |
| `GET` | `/healthz`, `/api/healthz` | No | Liveness |
| `GET` | `/readyz`, `/api/readyz` | No | Readiness (clave de Groq) |
| `GET` | `/metrics` | Red interna | Prometheus |

Contrato de `POST /api/v1/ai/chat`:

```json
{
  "prompt": "Describe este plato en una frase",
  "system": "Opcional. Por defecto, marketing gastronómico en español.",
  "temperature": 0.7,
  "max_tokens": 1024
}
```

Respuesta:

```json
{
  "content": "...",
  "model": "openai/gpt-oss-120b",
  "usage": { "prompt_tokens": 90, "completion_tokens": 63, "total_tokens": 153 },
  "attempts": 1,
  "latency_ms": 724,
  "request_id": "..."
}
```

Errores uniformes:

```json
{ "detail": { "code": "rate_limited", "message": "..." }, "request_id": "..." }
```

Códigos habituales: `validation_error` (422), `auth_required`/`invalid_token`
(401), `forbidden` (403), `rate_limited` (429), `prompt_too_long` (413),
`upstream_error`/`upstream_timeout` (502/504) e `internal_error` (500).

### 6.2 Autenticación

- El frontend envía `Authorization: Bearer <access_token>` si hay sesión de
  Supabase. Si no hay sesión, no envía cabecera.
- Con `AI_AUTH_MODE=supabase`, el gateway valida firma con el JWKS del proyecto,
  `aud=authenticated`, `iss=<SUPABASE_URL>/auth/v1` y exige `exp`/`iat`.
- `role=authenticated` → cuota de usuario.
- `role=anon` o sin token → cuota anónima por IP (`AI_ALLOW_ANON=true`).
- Token inválido o expirado → `401`. **No** se degrada a anónimo.
- Si el JWKS no responde → `503 auth_unavailable` (no se acepta el token a
  ciegas).

La IP real se toma de `X-Real-IP` (que Nginx sobrescribe) y, si falta, del
primer valor de `X-Forwarded-For`. No se confía en el `X-Forwarded-For` crudo
del cliente.

### 6.3 Cuotas y reintentos

- Token bucket en memoria por réplica, con limpieza de cubos inactivos.
- Cabeceras `X-RateLimit-Limit`, `X-RateLimit-Remaining` y `Retry-After` en 429.
- Como cada pod tiene su propio contador, la cuota efectiva se multiplica por
  el número de réplicas. Es aceptable para esta fase; Redis es la evolución
  documentada en `docs/adr/0004-rate-limit-en-memoria.md`.
- Ante `429`, `5xx` o timeout de Groq se reintenta con backoff y se pasa al
  siguiente modelo de `AI_GROQ_MODELS`. El presupuesto total está acotado por
  `AI_GROQ_TOTAL_TIMEOUT_SECONDS`.

### 6.4 Desarrollo sin Docker

```bash
cd services/ai-gateway
python -m venv .venv
.venv/Scripts/pip install --require-hashes -r requirements-dev.txt   # Windows
.venv/bin/pip install --require-hashes -r requirements-dev.txt       # Linux/macOS
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8001
```

En otra terminal, `pnpm dev`: Vite proxya `/api` a `http://localhost:8001`.

---

## 7. Kubernetes

### 7.1 Secreto del gateway

El secreto **no** se versiona. Créalo antes del primer sync:

```bash
kubectl create namespace tuki --dry-run=client -o yaml | kubectl apply -f -
kubectl create secret generic tuki-ai-gateway \
  --from-literal=GROQ_API_KEY="$GROQ_API_KEY" \
  -n tuki
```

En GitOps usa Sealed Secrets, External Secrets Operator o SOPS. La plantilla
`deploy/k8s/base/ai-gateway-secret.example.yaml` es solo documentación.

### 7.2 Overlay local (Docker Desktop / kind / k3d)

El overlay usa `tuki:local-0.2.0` y `tuki-ai-gateway:local-0.2.0`, una réplica y
desactiva Ingress, HPA, PDB, NetworkPolicy y la validación JWT.

```bash
docker build -t tuki:local-0.2.0 \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  .
docker build -t tuki-ai-gateway:local-0.2.0 services/ai-gateway

kubectl apply -k deploy/k8s/overlays/local
kubectl rollout status deployment/tuki -n tuki
kubectl rollout status deployment/tuki-ai-gateway -n tuki

kubectl port-forward -n tuki svc/tuki 8081:80
# en otra terminal:
kubectl port-forward -n tuki svc/backend 8002:8000
kubectl port-forward -n tuki svc/tuki 9114:9113

curl http://localhost:8081/healthz
curl http://localhost:8081/api/healthz
curl http://localhost:8081/api/v1/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Devuelve exactamente: hola"}'
```

> Docker Desktop cachea imágenes por etiqueta. Si cambias una imagen con el
> mismo tag, usa uno nuevo (`local-0.2.0`, `local-0.2.1`, …) o reimpórtala en el
> nodo. Es la causa más común de “el pod sigue con la configuración vieja”.

#### 7.2.1 Clúster kind

Si prefieres un clúster reproducible en lugar de Docker Desktop:

```bash
kind create cluster --config deploy/kind/cluster.yaml
kind load docker-image tuki:local-0.2.0 --name tuki
kind load docker-image tuki-ai-gateway:local-0.2.0 --name tuki
kubectl create namespace tuki --dry-run=client -o yaml | kubectl apply -f -
kubectl create secret generic tuki-ai-gateway \
  --from-literal=GROQ_API_KEY="$GROQ_API_KEY" -n tuki
kubectl apply -k deploy/k8s/overlays/local
kubectl port-forward -n tuki svc/tuki 8081:80
```

El clúster tiene un `control-plane` y dos `worker` para observar
`topologySpreadConstraints`; puedes reducirlo si tienes poca memoria. El acceso
es por `port-forward`: el overlay local elimina Ingress, HPA, PDB y
NetworkPolicy. Detalle y diagnóstico en `deploy/kind/README.md`.

> El CNI por defecto de kind no aplica NetworkPolicy de forma fiable. Para
> probarlas necesitas Calico u otro CNI compatible; en producción es un requisito
> del entorno.

### 7.3 Overlay de producción

Antes de aplicar:

1. Cambia `images[].newName` si tu registro no es GHCR.
2. Cambia `newTag` por la versión firmada.
3. Reemplaza `tuki.app` por tu dominio.
4. Ajusta el `ClusterIssuer` de cert-manager.
5. Reemplaza `SUPABASE_URL` (`https://TU_PROYECTO.supabase.co`). El gateway
   falla al arrancar si detecta el placeholder.
6. Crea el secreto `tuki-ai-gateway`.

```bash
kubectl kustomize deploy/k8s/overlays/production | less
kubectl apply -k deploy/k8s/overlays/production
kubectl rollout status deployment/tuki -n tuki
kubectl rollout status deployment/tuki-ai-gateway -n tuki
kubectl get pods,svc,ingress,hpa,pdb -n tuki
```

### 7.4 Recursos creados

| Recurso | Función |
| --- | --- |
| `Namespace tuki` | Pod Security `restricted` |
| `ServiceAccount tuki` | Sin token montado |
| `Deployment tuki` | 2 réplicas, rolling update, probes, sidecar exporter |
| `Service tuki` | :80 → :8080 y :9113 para métricas |
| `Deployment tuki-ai-gateway` | 2 réplicas, no-root 10001, probes `/readyz` |
| `Service backend` | `backend:8000` (host estable para Nginx) |
| `ConfigMap ai-gateway-config` | Configuración no secreta |
| `Secret tuki-ai-gateway` | `GROQ_API_KEY` (fuera de Git) |
| `Ingress tuki` | `/` → web, `/api` → gateway, TLS |
| `HPA` | web 2–20, gateway 2–20 por CPU |
| `PDB` | `minAvailable: 1`, `AlwaysAllow` para pods unhealthy |
| `NetworkPolicy` | Aísla web/gateway y limita egreso a 443/DNS |

El pod cumple `restricted`: `runAsNonRoot`, seccomp `RuntimeDefault`,
`allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`,
`readOnlyRootFilesystem: true` y `automountServiceAccountToken: false`.

> **NetworkPolicy y sondas:** algunos CNI aplican la política al kubelet. Si los
> pods fallan probes, añade una regla desde el CIDR de los nodos o quita la
> política del overlay. En local ya está desactivada.

---

## 8. Observabilidad

```bash
kubectl apply -k deploy/observability
```

Incluye:

- `ServiceMonitor/tuki-web` → `nginx-exporter:9113`.
- `ServiceMonitor/tuki-ai-gateway` → `/metrics:8000`.
- `PrometheusRule/tuki-alertas` con 7 alertas de disponibilidad, errores,
  latencia, rate limit, timeouts y conexiones de Nginx.
- Dashboard `Tuki · SPA y AI Gateway` como ConfigMap con etiqueta
  `grafana_dashboard: "1"` (7 paneles).

Ajusta la etiqueta `release` de los ServiceMonitor/PrometheusRule al selector de
tu kube-prometheus-stack.

Métricas principales del gateway:

| Métrica | Uso |
| --- | --- |
| `ai_gateway_http_requests_total{route,status}` | Tráfico y errores |
| `ai_gateway_http_request_duration_seconds` | Latencia p50/p95 |
| `ai_gateway_rate_limited_total{identity_type}` | Abuso o cuota baja |
| `ai_gateway_upstream_requests_total{model,outcome}` | Fallback entre modelos |
| `ai_gateway_tokens_total{model,kind}` | Consumo de Groq |
| `ai_gateway_auth_failures_total{reason}` | Tokens inválidos/JWKS caído |
| `nginx_connections_active`, `nginx_http_requests_total` | SPA |

---

## 9. GitOps con ArgoCD

| Aplicación | Overlay | Sync |
| --- | --- | --- |
| `tuki-local` | `deploy/k8s/overlays/local` | Manual |
| `tuki-production` | `deploy/k8s/overlays/production` | Auto + selfHeal + prune |

```bash
kubectl apply -f deploy/argocd/application-local.yaml
kubectl apply -f deploy/argocd/application-production.yaml
argocd app get tuki-production
argocd app history tuki-production
argocd app rollback tuki-production <ID>
```

`ignoreDifferences` evita que ArgoCD pelee con el HPA por `replicas`. Para
promover una versión, cambia `newTag` en el overlay y haz commit; ArgoCD
sincroniza sola.

Detalle: `deploy/argocd/README.md`.

---

## 10. Cadena de suministro (Fase 0)

### 10.1 Imágenes base fijadas por digest

| Imagen | Digest |
| --- | --- |
| `node:22-alpine` | `sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914` |
| `nginxinc/nginx-unprivileged:1.31.7-alpine` | `sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e` |
| `python:3.12-slim` | `sha256:a0f57064cbdcd6285fa45f51237ab0b35ea8ebaed06a1f5973e89e19dfb86704` |
| `nginx/nginx-prometheus-exporter:1.4.1` | `sha256:a146e4e56cedf2bd4858ce0d04cf4da0b7ce1c88b7973f9221934c8651fa3e1c` |

La etapa runtime de la web ejecuta `apk upgrade --no-cache` para aplicar parches
de Alpine publicados después del digest. Es una excepción consciente: el digest
fija la base, pero no congela los parches de seguridad. Se documenta en
`docs/adr/0002-cadena-de-suministro.md`.

### 10.2 Controles

| Control | Dónde | Qué valida |
| --- | --- | --- |
| Hadolint | CI + `verificar-supply-chain.sh` | Buenas prácticas de Dockerfile |
| Ruff + Pytest | CI | Calidad y 39 tests del gateway |
| kubeconform | CI + `validar-k8s.sh` | Esquema de Kubernetes/CRDs |
| kube-linter | CI + `validar-k8s.sh` | Buenas prácticas de manifiestos |
| conftest | CI + `validar-k8s.sh` | Políticas propias (rootfs, caps, límites) |
| Trivy | CI + local | CVEs, secretos y misconfiguraciones |
| Syft | CI + local | SBOM SPDX |
| Cosign keyless | CI | Firma OIDC de la imagen |
| provenance/SBOM | Buildx | Atestaciones de build |

Resultados locales de referencia (2026-10-27):

- `tuki:local-0.2.0`: 0 vulnerabilidades HIGH/CRITICAL corregibles.
- `tuki-ai-gateway:local-0.2.0`: 0 vulnerabilidades HIGH/CRITICAL corregibles.
- kubeconform: 45 recursos, 42 válidos y 3 CRDs omitidos a propósito.
- kube-linter: sin errores.
- conftest: 225 tests, 225 aprobados.
- hadolint: sin hallazgos.
- actionlint: workflow válido.
- shellcheck: scripts sin advertencias.
- Compose y K8s local (`docker-desktop`): `/healthz`, `/api/healthz`,
  `/api/v1/ai/models`, chat real contra Groq (HTTP 200) y métricas del exporter.
  Los pods corren como UID `101` (web) y `10001` (gateway).
- El clúster local no tiene `ingress-nginx` ni `metrics-server`: Ingress y HPA se
  validan por esquema y revisión estática, no en runtime.

### 10.3 Comandos

```bash
# Manifiestos
bash deploy/scripts/validar-k8s.sh

# Imágenes: hadolint, Trivy, Syft y firma opcional
bash deploy/scripts/verificar-supply-chain.sh
FIRMAR=true COSIGN_KEY=cosign.key bash deploy/scripts/verificar-supply-chain.sh
```

En Windows, ejecuta los scripts desde WSL o Git Bash; usan `$PWD` y
`/var/run/docker.sock`.

### 10.4 Verificar una imagen firmada

```bash
cosign verify ghcr.io/lianlee007/tuki@sha256:<digest> \
  --certificate-identity-regexp '^https://github.com/lianlee007/tuki/.github/workflows/contenedor.yml@refs/(heads|tags)/.*$' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com

cosign verify-attestation ghcr.io/lianlee007/tuki@sha256:<digest> \
  --type spdxjson \
  --certificate-identity-regexp '^https://github.com/lianlee007/tuki/.github/workflows/contenedor.yml@refs/(heads|tags)/.*$' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

### 10.5 Limitaciones conocidas

- No hay registro ni clúster de producción en este entorno: la firma keyless y
  la publicación en GHCR se ejecutan en GitHub Actions, no en local.
- El SBOM local se genera con Syft, pero la atestación de Buildx solo existe en
  las imágenes publicadas por CI.
- `apk upgrade` hace que dos builds del mismo commit puedan diferir en parches
  del sistema operativo. El SBOM y el digest de la imagen publicada registran lo
  que realmente se desplegó.

---

## 11. CI/CD

`.github/workflows/contenedor.yml`:

1. **Web:** `pnpm install --frozen-lockfile`, `pnpm build`, verificación de que
   no haya `gsk_`, `VITE_GROQ_API_KEY` ni `api.groq.com` en `dist`, Hadolint.
2. **Gateway:** instala con hashes, Ruff, Pytest, Hadolint.
3. **Dependencias:** `pip-audit` sobre `requirements.txt` y `pnpm audit` sobre
   producción. Las críticas bloquean; las altas y moderadas quedan visibles y se
   gestionan en `docs/security/hallazgos.md`.
4. **Manifiestos:** Kustomize, kubeconform, kube-linter, conftest.
5. **Catálogo:** valida el YAML de `catalog-info.yaml` y que las referencias de
   `owner`, `system` y `domain` existan.
6. **Workflows y scripts:** actionlint y shellcheck.
7. **Imágenes:** build multi-arquitectura `amd64/arm64`, GHCR, Trivy, Syft,
   Cosign keyless y verificación de firma.

Secretos de Actions necesarios:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

`GROQ_API_KEY` **no** se usa en el build; se inyecta en el clúster.

---

## 12. Diagnóstico y rollback

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| Build: faltan variables | No se pasaron los `--build-arg` | Usa Compose o el archivo de entorno |
| `502` en `/api` | El gateway no está Ready o no resuelve | `kubectl logs deploy/tuki-ai-gateway`; revisa el secreto |
| `401` con sesión iniciada | Token expirado o `SUPABASE_URL` incorrecta | Renueva sesión; verifica JWKS |
| `503 auth_unavailable` | Supabase JWKS inaccesible | Revisa egreso 443 y estado de Supabase |
| `429` constante | Cuota baja o abuso | Ajusta `AI_RATE_LIMIT_*`; revisa el panel |
| `504` en chat | Groq lento o timeout bajo | Sube `AI_GROQ_TOTAL_TIMEOUT_SECONDS` o baja reintentos |
| Pods con imagen vieja | Caché por tag | Usa un tag nuevo |
| HPA en `<unknown>` | Falta metrics-server | Instálalo o desactiva HPA |
| Ingress 404 | Host/clase no coinciden | `kubectl describe ingress -n tuki` |
| Pods reinician por probes | NetworkPolicy bloquea al kubelet | Ajusta la política |

Rollback:

```bash
# Kubernetes
kubectl rollout undo deployment/tuki -n tuki
kubectl rollout undo deployment/tuki-ai-gateway -n tuki
kubectl rollout history deployment/tuki -n tuki

# ArgoCD
argocd app rollback tuki-production <ID>

# Imagen concreta
kubectl set image deployment/tuki web=ghcr.io/lianlee007/tuki:<tag> -n tuki
```

Guía completa de incidentes y rotación de claves: `docs/runbook.md`.

---

## 13. Referencias

- `docs/adr/0001-ai-gateway.md`
- `docs/adr/0002-cadena-de-suministro.md`
- `docs/adr/0003-servicios-gestionados.md`
- `docs/adr/0004-rate-limit-en-memoria.md`
- `docs/runbook.md`
- `docs/modulos-1-3.md`
- `docs/security/modelo-de-amenazas.md`
- `docs/security/hallazgos.md`
- `docs/security/registro-uso-ia.md`
- `docs/plataforma/catalogo-backstage.md`
- `deploy/kind/README.md`
- `deploy/argocd/README.md`
- `deploy/loadtest/README.md`
