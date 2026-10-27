# Aplicación de los módulos 1–3 de CloudForge AI 5.0 a Riki

Este documento traza qué contenidos de los módulos **1 (fundamentos Cloud
Native, Linux, Git y contenedores)**, **2 (Kubernetes, GitOps y Platform
Engineering)** y **3 (DevSecOps y cadena de suministro)** se aplicaron al
proyecto Riki, con qué artefacto se demuestran y qué queda fuera de alcance.

Criterio de esta iteración: **aprovechar lo que el proyecto ya tenía y añadir
solo evidencias ligeras y verificables**. No se reescribió el producto, no se
instaló una plataforma completa y no se implementó IA local.

> **Fuera de alcance explícito:** módulos 5 y 6 (MLOps/LLMOps e IA local
> multimodal) y el componente de IA local del proyecto integrador. Riki usa un
> proveedor gestionado (Groq) a través de un gateway propio; no sirve modelos en
> el clúster.

---

## 1. Resumen de cobertura

| Módulo | Peso en el diplomado | Cobertura en Riki | Evidencia principal |
| --- | --- | --- | --- |
| 1. Fundamentos Cloud Native, Linux, Git y contenedores | 10 % | **Cubierto** | `Dockerfile`, `docker-compose.yml`, lockfiles, `.dockerignore`, ADR de cadena de suministro |
| 2. Kubernetes, GitOps y Platform Engineering | 15 % | **Cubierto con adaptaciones** | `deploy/k8s/base`, overlays `local` y `production`, ArgoCD, `catalog-info.yaml`, `deploy/kind/` |
| 3. DevSecOps y cadena de suministro | 15 % | **Cubierto con brechas documentadas** | CI, Trivy, Syft, Cosign, conftest, modelo de amenazas y bitácora de hallazgos |

Adaptaciones conscientes:

- **Servicios gestionados en lugar de estado en el clúster.** Supabase,
  Cloudinary y Groq no se containerizan. Ver `docs/adr/0003-servicios-gestionados.md`.
- **Kustomize en lugar de Helm.** El PDF admite Kustomize para variantes por
  ambiente. Se eligió por simplicidad y porque ArgoCD lo soporta de forma nativa.
- **Catálogo Backstage, no instalación completa.** El PDF permite diseñar el
  modelo de catálogo cuando la infraestructura no permite instalar la plataforma.
- **Sin IA local.** Decisión del alcance de este trabajo.

---

## 2. Lo que se agregó en esta iteración

| Archivo | Propósito |
| --- | --- |
| `docs/modulos-1-3.md` | Esta matriz de cumplimiento y evidencias |
| `docs/security/modelo-de-amenazas.md` | Modelo STRIDE, activos, fronteras de confianza y riesgos residuales |
| `docs/security/hallazgos.md` | Bitácora de hallazgos con criticidad, tratamiento y estado |
| `docs/security/registro-uso-ia.md` | Registro y controles del software asistido por IA |
| `catalog-info.yaml` | Catálogo mínimo de Backstage: dominio, sistema, componentes, recursos y equipo |
| `docs/plataforma/catalogo-backstage.md` | Uso del catálogo y golden path para nuevos servicios |
| `deploy/kind/cluster.yaml` | Clúster local reproducible con `kind` |
| `deploy/kind/README.md` | Construcción, carga de imágenes y despliegue en `kind` |
| `.github/workflows/contenedor.yml` | Job de auditoría de dependencias (`pip-audit` y `pnpm audit`) |

También se retiró del CSP el origen `generativelanguage.googleapis.com`, que ya
no usa la aplicación tras eliminar la integración con Gemini.

---

## 3. Módulo 1 — Fundamentos Cloud Native, Linux, Git y contenedores

### 3.1 Matriz de contenidos

| Contenido del PDF | Aplicación en Riki | Evidencia | Estado |
| --- | --- | --- | --- |
| Terminal, procesos, puertos, DNS, HTTP y TLS | Flujo navegador → Ingress/Nginx → gateway; puertos 8080 y 8000; TLS en Ingress | `deploy/README.md` §1, `docker/nginx/conf.d/default.conf`, `deploy/k8s/base/ingress.yaml` | Cubierto |
| Virtualización frente a contenedores; namespaces y cgroups | Contenedores sin privilegios, límites de CPU/memoria y rootfs de solo lectura | `Dockerfile`, `services/ai-gateway/Dockerfile`, `docker-compose.yml` | Cubierto |
| Imágenes, capas y registries | Build multi-etapa; imagen publicada en GHCR; bases fijadas por digest | `Dockerfile`, `.github/workflows/contenedor.yml`, `docs/adr/0002-cadena-de-suministro.md` | Cubierto |
| Volúmenes y redes de contenedor | Red interna de Compose; `/tmp` efímero; sin volúmenes persistentes | `docker-compose.yml`, `deploy/k8s/base/deployment.yaml` | Cubierto |
| Configuración externa y secretos de laboratorio | Variables `VITE_*` en build; `GROQ_API_KEY` solo en runtime; plantillas `.env.example` | `deploy/README.md` §4, `.env.example`, `services/ai-gateway/.env.example` | Cubierto |
| Doce factores | Aplicación sin estado, configuración por entorno, logs a stdout, puertos explícitos, procesos descartables | Ver tabla 3.2 | Cubierto con matices |
| Construcción reproducible | `pnpm-lock.yaml`, `requirements.txt` con hashes, `--frozen-lockfile`, bases por digest | `pnpm-lock.yaml`, `services/ai-gateway/requirements.txt`, CI | Cubierto |
| Docker Compose con dependencias | `web` + `ai-gateway`; Supabase/Cloudinary/Groq como servicios gestionados | `docker-compose.yml`, ADR 0003 | Cubierto con adaptación |
| Pruebas y validación | `pytest` (39 pruebas), `ruff`, build de Vite, Hadolint | CI, `services/ai-gateway/tests/` | Cubierto |
| Inspección de tamaño, puertos, procesos y recursos | Límites en Compose/K8s, imágenes multi-etapa, usuario no root | `docker-compose.yml`, manifiestos, `deploy/scripts/verificar-supply-chain.sh` | Cubierto |
| Microproyecto con README, Dockerfile, Compose, variables de ejemplo, pruebas y decisiones | Todo presente en el repositorio | `README.md`, `deploy/README.md`, `docs/adr/`, tests | Cubierto |

### 3.2 Doce factores en Riki

| Factor | Cómo se cumple |
| --- | --- |
| 1. Código base versionado | Repositorio Git único con frontend, gateway, despliegue y documentación |
| 2. Dependencias declaradas | `pnpm-lock.yaml` y `requirements.txt` con hashes |
| 3. Configuración en el entorno | `VITE_*` en build; variables del gateway en runtime; sin configuración hardcodeada de secretos |
| 4. Servicios de respaldo | Supabase, Cloudinary y Groq se tratan como recursos externos sustituibles |
| 5. Build, release y run separados | Imagen inmutable por tag/digest; configuración inyectada al desplegar |
| 6. Procesos sin estado | La SPA es estática; el gateway no escribe estado local salvo el rate limit en memoria |
| 7. Vinculación a puertos | Nginx en `8080`, gateway en `8000`, servicios en `80`/`8000` |
| 8. Concurrencia | Réplicas y HPA (2–20) en producción |
| 9. Descartabilidad | Probes, `terminationGracePeriodSeconds` y arranque rápido |
| 10. Paridad dev/prod | Compose y K8s comparten imagen; **matiz:** en local se desactiva la validación JWT |
| 11. Logs como flujo de eventos | Nginx a stdout; gateway con logs JSON y `request_id` |
| 12. Procesos administrativos | Migraciones SQL fuera del runtime; no hay consola administrativa en el contenedor |

### 3.3 Evidencias ejecutables

```bash
# Build de la SPA
pnpm install --frozen-lockfile
pnpm build

# Gateway
cd services/ai-gateway
python -m pip install --require-hashes -r requirements-dev.txt
ruff check app tests
pytest

# Stack local
docker compose --env-file .env.local config
docker compose --env-file .env.local up -d --build
curl http://localhost:8080/healthz
curl http://localhost:8080/api/healthz
```

---

## 4. Módulo 2 — Kubernetes, GitOps y Platform Engineering

### 4.1 Matriz de contenidos

| Contenido del PDF | Aplicación en Riki | Evidencia | Estado |
| --- | --- | --- | --- |
| Clúster local con kind, minikube o k3d | Configuración reproducible de `kind`; el runtime validado fue Docker Desktop | `deploy/kind/cluster.yaml`, `deploy/kind/README.md` | Cubierto (kind no ejecutado en este entorno) |
| Modelo declarativo y reconciliación | Manifiestos declarativos; ArgoCD con `selfHeal` y `prune` | `deploy/k8s/`, `deploy/argocd/application-production.yaml` | Cubierto |
| Pods, Deployments, ReplicaSets | Dos Deployments con rolling update, probes y réplicas | `deploy/k8s/base/deployment.yaml`, `ai-gateway-deployment.yaml` | Cubierto |
| StatefulSets, DaemonSets, Jobs y CronJobs | No se usan en la aplicación: no hay estado local ni tareas programadas | ADR 0003 | No aplica |
| Services e Ingress | `Service` ClusterIP y Ingress con `/` y `/api` | `deploy/k8s/base/service.yaml`, `ai-gateway-service.yaml`, `ingress.yaml` | Cubierto |
| ConfigMaps y Secrets | ConfigMap del gateway y secreto `riki-ai-gateway` fuera de Git | `ai-gateway-configmap.yaml`, `ai-gateway-secret.example.yaml` | Cubierto |
| PersistentVolumes y StorageClass | No aplica: datos en Supabase y archivos en Cloudinary | ADR 0003 | No aplica |
| Namespaces y RBAC | Namespace `riki`; ServiceAccount sin token; la app no llama a la API de Kubernetes | `namespace.yaml`, `serviceaccount.yaml` | Cubierto con alcance mínimo |
| Requests, limits y probes | Límites, `liveness`/`readiness`/`startup` y recursos por contenedor | Deployments y HPA | Cubierto |
| Autoscaling, PDB y alta disponibilidad | HPA 2–20, PDB `minAvailable: 1`, topología y anti-affinity | `hpa.yaml`, `pdb.yaml`, Deployments | Cubierto (diseño; runtime limitado en local) |
| NetworkPolicy | Aísla web/gateway y restringe egreso a 443 y DNS | `networkpolicy.yaml` | Cubierto en producción; desactivado en local |
| Actualización y rollback | Rolling update, `kubectl rollout undo`, rollback de ArgoCD | `docs/runbook.md`, `deploy/README.md` §12 | Cubierto |
| Helm o Kustomize | Kustomize con base y overlays por ambiente | `deploy/k8s/base`, `overlays/local`, `overlays/production` | Cubierto con adaptación |
| Registro local o institucional | GHCR para imágenes firmadas; `kind load` para imágenes locales | CI, `deploy/kind/README.md` | Cubierto con adaptación |
| GitOps con ArgoCD | Aplicaciones `riki-local` y `riki-production`; drift corregido con `selfHeal` | `deploy/argocd/` | Cubierto |
| Backstage y catálogo de servicios | Catálogo mínimo con dominio, sistema, componentes, recursos y equipo | `catalog-info.yaml`, `docs/plataforma/catalogo-backstage.md` | Cubierto con adaptación |
| Golden paths | Ruta guiada para crear un servicio con los mismos controles | `docs/plataforma/catalogo-backstage.md` §4 | Cubierto |

### 4.2 Decisiones de plataforma

- **No se usa Helm.** Kustomize cubre los dos ambientes sin mantener un chart
  propio; ArgoCD renderiza el overlay directamente. Si el proyecto crece a
  varios equipos, Helm o un chart compartido puede ser la evolución.
- **No hay StatefulSet ni almacenamiento en el clúster.** Introducir una base de
  datos en Kubernetes sin operador, backups y pruebas de restauración sería un
  riesgo mayor que usar Supabase.
- **RBAC mínimo.** La aplicación no necesita leer ni escribir objetos de
  Kubernetes, por eso no se crean Roles ni RoleBindings. El control de acceso de
  operadores y de ArgoCD se gestiona fuera de este repositorio.
- **Backstage no se instala completo.** El catálogo es válido y registrable,
  pero no se levanta el portal ni TechDocs. Es la alternativa que el propio PDF
  admite cuando la infraestructura no permite la plataforma completa.

### 4.3 Evidencias ejecutables

```bash
# Renderizado de overlays
kubectl kustomize deploy/k8s/overlays/local > build/local.yaml
kubectl kustomize deploy/k8s/overlays/production > build/production.yaml
kubectl kustomize deploy/observability > build/observability.yaml

# Validación estática
bash deploy/scripts/validar-k8s.sh

# Despliegue local (Docker Desktop)
kubectl apply -k deploy/k8s/overlays/local
kubectl rollout status deployment/riki -n riki
kubectl rollout status deployment/riki-ai-gateway -n riki
kubectl port-forward -n riki svc/riki 8081:80
```

Para `kind`:

```bash
kind create cluster --config deploy/kind/cluster.yaml
kind load docker-image riki:local-0.2.0 --name riki
kind load docker-image riki-ai-gateway:local-0.2.0 --name riki
kubectl apply -k deploy/k8s/overlays/local
```

---

## 5. Módulo 3 — DevSecOps y seguridad de la cadena de suministro

### 5.1 Matriz de contenidos

| Contenido del PDF | Aplicación en Riki | Evidencia | Estado |
| --- | --- | --- | --- |
| Threat modeling básico | Modelo STRIDE con activos, actores, fronteras y riesgos residuales | `docs/security/modelo-de-amenazas.md` | Cubierto |
| Gestión de dependencias | Lockfiles, hashes, auditoría Python y frontend | `pnpm-lock.yaml`, `requirements.txt`, job `auditoria-dependencias` | Cubierto con hallazgos abiertos |
| Secretos | Sin claves en Git ni en el bundle; secreto de K8s; rotación documentada | `.gitignore`, `.dockerignore`, `docs/runbook.md`, CI | Cubierto |
| Análisis estático | Ruff en el gateway; el frontend no tiene ESLint ni `tsc` como gate | CI, `docs/security/hallazgos.md` | Parcial |
| Análisis de composición de software | Trivy, `pip-audit` y `pnpm audit` | CI y ejecución local | Cubierto |
| Vulnerabilidades de imágenes | Trivy sobre ambas imágenes con `CRITICAL,HIGH` | CI, `deploy/scripts/verificar-supply-chain.sh` | Cubierto |
| Hardening de contenedores | No root, rootfs de solo lectura, `cap_drop: ALL`, seccomp, sin escalada | Dockerfiles, Compose, manifiestos | Cubierto |
| Reducción de superficie | Build multi-etapa; runtime sin toolchain de build; usuario sin privilegios | `Dockerfile`, `services/ai-gateway/Dockerfile` | Cubierto |
| SBOM | Syft en CI y local; SPDX JSON | CI, `deploy/scripts/verificar-supply-chain.sh` | Cubierto en CI |
| Procedencia | `provenance: true` y `sbom: true` en Buildx | CI | Cubierto en CI |
| Firma y verificación | Cosign keyless con identidad OIDC de GitHub Actions | CI, `deploy/README.md` §10.4 | Cubierto en CI |
| Políticas de admisión | conftest valida manifiestos antes de desplegar; no hay admission controller | `deploy/policies/kubernetes.rego` | Parcial |
| Segregación de funciones | OIDC para GHCR, `GITHUB_TOKEN` de corta duración, ArgoCD separado del CI | CI, `deploy/argocd/` | Parcial (sin evidencia de branch protection) |
| Vulnerabilidad, mala configuración y riesgo contextual | La bitácora separa criticidad técnica, explotabilidad y tratamiento | `docs/security/hallazgos.md` | Cubierto |
| Pipeline con lint, pruebas, build, escaneo y publicación | Jobs `validar-web`, `validar-gateway`, `validar-manifiestos`, `auditoria-dependencias`, `imagen-web`, `imagen-gateway` | `.github/workflows/contenedor.yml` | Cubierto |
| Controles para código generado por IA | Pruebas, linters, SCA, escaneo de secretos y revisión humana; sin trazabilidad completa de prompts | CI, `docs/security/registro-uso-ia.md` | Parcial |
| Revisión de licencias | No automatizada | — | Abierto |

### 5.2 Controles y umbrales

| Control | Herramienta | Umbral actual |
| --- | --- | --- |
| Lint Python | Ruff | Cualquier hallazgo falla |
| Pruebas gateway | Pytest | 39 pruebas |
| Lint Dockerfile | Hadolint | `warning` |
| Esquema Kubernetes | kubeconform | `strict`; CRDs omitidos |
| Buenas prácticas K8s | kube-linter | Cualquier error falla |
| Políticas propias | conftest | 189 pruebas |
| Vulnerabilidades de imagen | Trivy | `CRITICAL,HIGH` corregibles |
| Dependencias Python | pip-audit | Cualquier vulnerabilidad conocida falla |
| Dependencias frontend | pnpm audit | Críticas bloquean; altas/moderadas informativas |
| Firma | Cosign keyless | Solo en push/tag, no en PR |

### 5.3 Evidencias ejecutables

```bash
# Gateway
cd services/ai-gateway
uvx ruff check app tests
uv run pytest
uvx pip-audit -r requirements.txt --require-hashes

# Frontend
cd ../..
pnpm audit --prod --audit-level critical
pnpm audit --prod --audit-level high   # informativo; ver hallazgos

# Manifiestos
bash deploy/scripts/validar-k8s.sh

# Imágenes
bash deploy/scripts/verificar-supply-chain.sh
```

### 5.4 Resultados de referencia (2026-10-25)

| Validación | Resultado |
| --- | --- |
| `pytest` | 39 pruebas aprobadas |
| `ruff` | Sin hallazgos |
| `pnpm build` | Correcto |
| Hadolint | Sin hallazgos |
| Actionlint | Workflow válido |
| Shellcheck | Scripts sin advertencias |
| kubeconform | 25 recursos, 22 válidos, 3 CRDs omitidos |
| kube-linter | Sin errores |
| conftest | 189/189 |
| `docker compose config` | Válido |
| Runtime Compose | `/healthz`, `/api/healthz`, modelos y chat real (HTTP 200) |
| Runtime K8s local | Mismos endpoints; pods como UID 101 y 10001 |
| Trivy imágenes | 0 vulnerabilidades `HIGH`/`CRITICAL` corregibles |
| `pip-audit` | Sin vulnerabilidades conocidas |
| `pnpm audit --prod` | 9 altas, 7 moderadas, 0 críticas → hallazgo abierto |
| `kind` | Configuración incluida; no ejecutada en este entorno |

> El clúster Docker Desktop no tiene `ingress-nginx` ni `metrics-server`. El
> Ingress y el HPA se validaron por esquema y revisión estática, no en runtime.
> La firma Cosign y la publicación en GHCR solo se ejecutan en GitHub Actions.

---

## 6. Brechas y trabajo futuro

| Brecha | Impacto | Siguiente paso |
| --- | --- | --- |
| 9 vulnerabilidades altas en dependencias del frontend (`react-router`, `zod`, `ws`) | Medio | Actualizar en una rama aparte con regresión visual y de rutas; ver `docs/security/hallazgos.md` |
| Sin ESLint ni `tsc --noEmit` en CI | Medio | Corregir los errores de tipos existentes y añadir el gate |
| Sin admission controller | Medio | Evaluar Kyverno o Gatekeeper; reutilizar las políticas de `deploy/policies` |
| Acciones de GitHub fijadas por tag, no por SHA | Medio | Fijar SHA y usar Dependabot/Renovate |
| Sin clúster ni registro de producción | Operativo | Repetir las validaciones en el entorno real antes del despliegue |
| Backstage no instalado | Bajo | El catálogo ya está listo para registrarse cuando exista portal |
| Sin revisión automatizada de licencias | Bajo | Añadir `pnpm licenses ls` o `licensee` al CI |
| Rate limit por réplica | Bajo | Redis o un limitador compartido; ADR 0004 |
| Sin WAF ni protección DDoS de aplicación | Medio | Cloudflare/ingress-nginx con límites y reglas |
| CSP con `unsafe-inline`/`unsafe-eval` por Tailwind CDN | Medio | Compilar Tailwind en build y endurecer CSP |
| Sin SBOM firmado como artefacto de release | Bajo | Adjuntar SBOM al release y conservarlo |
| IA local no implementada | Fuera de alcance | No aplica a este trabajo |

---

## 7. Checklist de entrega por módulo

### Módulo 1

- [x] Repositorio Git con README y decisiones documentadas.
- [x] Dockerfile multi-etapa y usuario no root.
- [x] Docker Compose con servicio auxiliar y red interna.
- [x] Variables de ejemplo sin secretos reales.
- [x] Pruebas y linters ejecutables.
- [x] Build reproducible con lockfiles y digests.
- [x] Diagnóstico de fallos de configuración documentado.

### Módulo 2

- [x] Manifiestos Kubernetes con probes, límites y seguridad.
- [x] Overlays por ambiente con Kustomize.
- [x] GitOps con ArgoCD y corrección de drift.
- [x] Estrategia de actualización y rollback.
- [x] Catálogo mínimo de Backstage y golden path.
- [x] Configuración de clúster local con `kind`.
- [ ] Ingress/HPA verificados en un clúster con controladores (pendiente de entorno).

### Módulo 3

- [x] Modelo de amenazas.
- [x] Bitácora de hallazgos con tratamiento.
- [x] Pipeline con lint, pruebas, build, escaneo y publicación.
- [x] SBOM, procedencia y firma keyless.
- [x] Hardening de contenedores y políticas pre-despliegue.
- [x] Auditoría de dependencias Python y frontend.
- [ ] Actualización de las dependencias altas del frontend.
- [ ] Admission controller y verificación de firma en admisión.

---

## 8. Referencias

- `deploy/README.md` — guía operativa completa.
- `docs/runbook.md` — incidentes, rotación y rollback.
- `docs/adr/` — decisiones de arquitectura.
- `docs/security/modelo-de-amenazas.md` — análisis de riesgos.
- `docs/security/hallazgos.md` — bitácora de seguridad.
- `docs/security/registro-uso-ia.md` — registro de software asistido por IA.
- `docs/plataforma/catalogo-backstage.md` — catálogo y golden path.
- `deploy/kind/README.md` — clúster local reproducible.
- `.github/workflows/contenedor.yml` — pipeline de CI/CD.
