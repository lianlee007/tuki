# AplicaciÃ³n de los mÃ³dulos 1â€“3 de CloudForge AI 5.0 a Riki

Este documento traza quÃ© contenidos de los mÃ³dulos **1 (fundamentos Cloud
Native, Linux, Git y contenedores)**, **2 (Kubernetes, GitOps y Platform
Engineering)** y **3 (DevSecOps y cadena de suministro)** se aplicaron al
proyecto Riki, con quÃ© artefacto se demuestran y quÃ© queda fuera de alcance.

Criterio de esta iteraciÃ³n: **aprovechar lo que el proyecto ya tenÃ­a y aÃ±adir
solo evidencias ligeras y verificables**. No se reescribiÃ³ el producto, no se
instalÃ³ una plataforma completa y no se implementÃ³ IA local.

> **Fuera de alcance explÃ­cito:** mÃ³dulos 5 y 6 (MLOps/LLMOps e IA local
> multimodal) y el componente de IA local del proyecto integrador. Riki usa un
> proveedor gestionado (Groq) a travÃ©s de un gateway propio; no sirve modelos en
> el clÃºster.

---

## 1. Resumen de cobertura

| MÃ³dulo | Peso en el diplomado | Cobertura en Riki | Evidencia principal |
| --- | --- | --- | --- |
| 1. Fundamentos Cloud Native, Linux, Git y contenedores | 10 % | **Cubierto** | `Dockerfile`, `docker-compose.yml`, lockfiles, `.dockerignore`, ADR de cadena de suministro |
| 2. Kubernetes, GitOps y Platform Engineering | 15 % | **Cubierto con adaptaciones** | `deploy/k8s/base`, overlays `local` y `production`, ArgoCD, `catalog-info.yaml`, `deploy/kind/` |
| 3. DevSecOps y cadena de suministro | 15 % | **Cubierto con brechas documentadas** | CI, Trivy, Syft, Cosign, conftest, modelo de amenazas y bitÃ¡cora de hallazgos |

Adaptaciones conscientes:

- **Servicios gestionados en lugar de estado en el clÃºster.** Supabase,
  Cloudinary y Groq no se containerizan. Ver `docs/adr/0003-servicios-gestionados.md`.
- **Kustomize en lugar de Helm.** El PDF admite Kustomize para variantes por
  ambiente. Se eligiÃ³ por simplicidad y porque ArgoCD lo soporta de forma nativa.
- **CatÃ¡logo Backstage, no instalaciÃ³n completa.** El PDF permite diseÃ±ar el
  modelo de catÃ¡logo cuando la infraestructura no permite instalar la plataforma.
- **Sin IA local.** DecisiÃ³n del alcance de este trabajo.

---

## 2. Lo que se agregÃ³ en esta iteraciÃ³n

| Archivo | PropÃ³sito |
| --- | --- |
| `docs/modulos-1-3.md` | Esta matriz de cumplimiento y evidencias |
| `docs/security/modelo-de-amenazas.md` | Modelo STRIDE, activos, fronteras de confianza y riesgos residuales |
| `docs/security/hallazgos.md` | BitÃ¡cora de hallazgos con criticidad, tratamiento y estado |
| `docs/security/registro-uso-ia.md` | Registro y controles del software asistido por IA |
| `catalog-info.yaml` | CatÃ¡logo mÃ­nimo de Backstage: dominio, sistema, componentes, recursos y equipo |
| `docs/plataforma/catalogo-backstage.md` | Uso del catÃ¡logo y golden path para nuevos servicios |
| `deploy/kind/cluster.yaml` | ClÃºster local reproducible con `kind` |
| `deploy/kind/README.md` | ConstrucciÃ³n, carga de imÃ¡genes y despliegue en `kind` |
| `.github/workflows/contenedor.yml` | Job de auditorÃ­a de dependencias (`pip-audit` y `pnpm audit`) |

### 2.1 Segunda iteraciÃ³n: cerrar brechas del alcance 1â€“3

| Archivo | PropÃ³sito |
| --- | --- |
| `tests/frontend/` | 36 pruebas de Vitest sobre contraste WCAG, slugs y formato de precio |
| `eslint.config.js` | Lint del frontend como gate de CI |
| `scripts/licencias.mjs` | RevisiÃ³n de licencias de producciÃ³n; bloquea GPL/AGPL |
| `.github/workflows/contenedor.yml` | Gates de `tsc`, ESLint y Vitest; job `secretos` con gitleaks; licencias; acciones fijadas por SHA |
| `.github/dependabot.yml` | ActualizaciÃ³n semanal de npm, pip, acciones y Dockerfiles |
| `.github/CODEOWNERS`, `PULL_REQUEST_TEMPLATE.md` | Propiedad del cÃ³digo y checklist de seguridad en cada PR |
| `deploy/security/kyverno/` | LÃ­nea base de pods y verificaciÃ³n de firma Cosign en admisiÃ³n |
| `deploy/k8s/overlays/local-plataforma` | Overlay con Ingress, HPA, PDB y NetworkPolicy para clÃºsteres con controladores |
| `deploy/k8s/base/rbac.yaml` | Rol de solo lectura para el equipo, sin acceso a Secretos |
| `deploy/scripts/demo-plataforma.sh` | Instala metrics-server, ingress-nginx y ArgoCD y demuestra el mÃ³dulo 2 |
| `deploy/argocd/application-laboratorio.yaml` | Application de laboratorio con `selfHeal` y excepciÃ³n de rÃ©plicas para el HPA |
| `docs/laboratorio/fallo-inducido.md` | PrÃ¡ctica del mÃ³dulo 1 con sÃ­ntoma, diagnÃ³stico y restauraciÃ³n |
| `docs/laboratorio/modulo-2-runtime.md` | Evidencias reales de Ingress, HPA, ArgoCD y endurecimiento |

TambiÃ©n se retirÃ³ del CSP el origen `generativelanguage.googleapis.com`, que ya
no usa la aplicaciÃ³n tras eliminar la integraciÃ³n con Gemini.

---

## 3. MÃ³dulo 1 â€” Fundamentos Cloud Native, Linux, Git y contenedores

### 3.1 Matriz de contenidos

| Contenido del PDF | AplicaciÃ³n en Riki | Evidencia | Estado |
| --- | --- | --- | --- |
| Terminal, procesos, puertos, DNS, HTTP y TLS | Flujo navegador â†’ Ingress/Nginx â†’ gateway; puertos 8080 y 8000; TLS en Ingress | `deploy/README.md` Â§1, `docker/nginx/conf.d/default.conf`, `deploy/k8s/base/ingress.yaml` | Cubierto |
| VirtualizaciÃ³n frente a contenedores; namespaces y cgroups | Contenedores sin privilegios, lÃ­mites de CPU/memoria y rootfs de solo lectura | `Dockerfile`, `services/ai-gateway/Dockerfile`, `docker-compose.yml` | Cubierto |
| ImÃ¡genes, capas y registries | Build multi-etapa; imagen publicada en GHCR; bases fijadas por digest | `Dockerfile`, `.github/workflows/contenedor.yml`, `docs/adr/0002-cadena-de-suministro.md` | Cubierto |
| VolÃºmenes y redes de contenedor | Red interna de Compose; `/tmp` efÃ­mero; sin volÃºmenes persistentes | `docker-compose.yml`, `deploy/k8s/base/deployment.yaml` | Cubierto |
| ConfiguraciÃ³n externa y secretos de laboratorio | Variables `VITE_*` en build; `GROQ_API_KEY` solo en runtime; plantillas `.env.example` | `deploy/README.md` Â§4, `.env.example`, `services/ai-gateway/.env.example` | Cubierto |
| Doce factores | AplicaciÃ³n sin estado, configuraciÃ³n por entorno, logs a stdout, puertos explÃ­citos, procesos descartables | Ver tabla 3.2 | Cubierto con matices |
| ConstrucciÃ³n reproducible | `pnpm-lock.yaml`, `requirements.txt` con hashes, `--frozen-lockfile`, bases por digest | `pnpm-lock.yaml`, `services/ai-gateway/requirements.txt`, CI | Cubierto |
| Docker Compose con dependencias | `web` + `ai-gateway`; Supabase/Cloudinary/Groq como servicios gestionados | `docker-compose.yml`, ADR 0003 | Cubierto con adaptaciÃ³n |
| Pruebas y validaciÃ³n | `pytest` (39 pruebas), `vitest` (36 pruebas), `tsc --noEmit`, ESLint, Ruff, build de Vite, Hadolint | CI, `services/ai-gateway/tests/`, `tests/frontend/` | Cubierto |
| InspecciÃ³n de tamaÃ±o, puertos, procesos y recursos | LÃ­mites en Compose/K8s, imÃ¡genes multi-etapa, usuario no root | `docker-compose.yml`, manifiestos, `deploy/scripts/verificar-supply-chain.sh` | Cubierto |
| Microproyecto con README, Dockerfile, Compose, variables de ejemplo, pruebas y decisiones | Todo presente en el repositorio | `README.md`, `deploy/README.md`, `docs/adr/`, tests | Cubierto |

### 3.2 Doce factores en Riki

| Factor | CÃ³mo se cumple |
| --- | --- |
| 1. CÃ³digo base versionado | Repositorio Git Ãºnico con frontend, gateway, despliegue y documentaciÃ³n |
| 2. Dependencias declaradas | `pnpm-lock.yaml` y `requirements.txt` con hashes |
| 3. ConfiguraciÃ³n en el entorno | `VITE_*` en build; variables del gateway en runtime; sin configuraciÃ³n hardcodeada de secretos |
| 4. Servicios de respaldo | Supabase, Cloudinary y Groq se tratan como recursos externos sustituibles |
| 5. Build, release y run separados | Imagen inmutable por tag/digest; configuraciÃ³n inyectada al desplegar |
| 6. Procesos sin estado | La SPA es estÃ¡tica; el gateway no escribe estado local salvo el rate limit en memoria |
| 7. VinculaciÃ³n a puertos | Nginx en `8080`, gateway en `8000`, servicios en `80`/`8000` |
| 8. Concurrencia | RÃ©plicas y HPA (2â€“20) en producciÃ³n |
| 9. Descartabilidad | Probes, `terminationGracePeriodSeconds` y arranque rÃ¡pido |
| 10. Paridad dev/prod | Compose y K8s comparten imagen; **matiz:** en local se desactiva la validaciÃ³n JWT |
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

## 4. MÃ³dulo 2 â€” Kubernetes, GitOps y Platform Engineering

### 4.1 Matriz de contenidos

| Contenido del PDF | AplicaciÃ³n en Riki | Evidencia | Estado |
| --- | --- | --- | --- |
| ClÃºster local con kind, minikube o k3d | ConfiguraciÃ³n reproducible de `kind`; el runtime validado fue Docker Desktop | `deploy/kind/cluster.yaml`, `deploy/kind/README.md` | Cubierto (kind no ejecutado en este entorno) |
| Modelo declarativo y reconciliaciÃ³n | Manifiestos declarativos; ArgoCD con `selfHeal` y `prune` | `deploy/k8s/`, `deploy/argocd/application-production.yaml` | Cubierto |
| Pods, Deployments, ReplicaSets | Dos Deployments con rolling update, probes y rÃ©plicas | `deploy/k8s/base/deployment.yaml`, `ai-gateway-deployment.yaml` | Cubierto |
| StatefulSets, DaemonSets, Jobs y CronJobs | No se usan en la aplicaciÃ³n: no hay estado local ni tareas programadas | ADR 0003 | No aplica |
| Services e Ingress | `Service` ClusterIP e Ingress con `/` y `/api`; verificado en runtime con ingress-nginx (`/healthz` y `/api/healthz` responden 200) | `deploy/k8s/base/ingress.yaml`, `deploy/k8s/overlays/local-plataforma`, `docs/laboratorio/modulo-2-runtime.md` | Cubierto |
| ConfigMaps y Secrets | ConfigMap del gateway y secreto `riki-ai-gateway` fuera de Git | `ai-gateway-configmap.yaml`, `ai-gateway-secret.example.yaml` | Cubierto |
| PersistentVolumes y StorageClass | No aplica: datos en Supabase y archivos en Cloudinary | ADR 0003 | No aplica |
| Namespaces y RBAC | Namespace `riki`; ServiceAccount sin token; `Role`/`RoleBinding` de solo lectura (pods, logs, deployments, ingress) para el grupo de desarrolladores, sin acceso a Secretos | `namespace.yaml`, `serviceaccount.yaml`, `rbac.yaml` | Cubierto |
| Requests, limits y probes | LÃ­mites, `liveness`/`readiness`/`startup` y recursos por contenedor | Deployments y HPA | Cubierto |
| Autoscaling, PDB y alta disponibilidad | HPA 2â€“20 con mÃ©tricas reales de metrics-server (escalÃ³ de 1 a 2 rÃ©plicas), PDB `minAvailable: 1`, topologÃ­a y anti-affinity | `hpa.yaml`, `pdb.yaml`, Deployments, `docs/laboratorio/modulo-2-runtime.md` | Cubierto en runtime |
| NetworkPolicy | AÃ­sla web/gateway y restringe egreso a 443 y DNS | `networkpolicy.yaml` | Cubierto en producciÃ³n; desactivado en local |
| ActualizaciÃ³n y rollback | Rolling update, `kubectl rollout undo`, rollback de ArgoCD | `docs/runbook.md`, `deploy/README.md` Â§12 | Cubierto |
| Helm o Kustomize | Kustomize con base y overlays por ambiente | `deploy/k8s/base`, `overlays/local`, `overlays/production` | Cubierto con adaptaciÃ³n |
| Registro local o institucional | GHCR para imÃ¡genes firmadas; `kind load` para imÃ¡genes locales | CI, `deploy/kind/README.md` | Cubierto con adaptaciÃ³n |
| GitOps con ArgoCD | Aplicaciones `riki-local`, `riki-production` y `riki-laboratorio`; sync, deriva y `selfHeal` demostrados en runtime | `deploy/argocd/`, `docs/laboratorio/modulo-2-runtime.md` Â§7 | Cubierto en runtime |
| Backstage y catÃ¡logo de servicios | CatÃ¡logo mÃ­nimo con dominio, sistema, componentes, recursos y equipo | `catalog-info.yaml`, `docs/plataforma/catalogo-backstage.md` | Cubierto con adaptaciÃ³n |
| Golden paths | Ruta guiada para crear un servicio con los mismos controles | `docs/plataforma/catalogo-backstage.md` Â§4 | Cubierto |

### 4.2 Decisiones de plataforma

- **No se usa Helm.** Kustomize cubre los dos ambientes sin mantener un chart
  propio; ArgoCD renderiza el overlay directamente. Si el proyecto crece a
  varios equipos, Helm o un chart compartido puede ser la evoluciÃ³n.
- **No hay StatefulSet ni almacenamiento en el clÃºster.** Introducir una base de
  datos en Kubernetes sin operador, backups y pruebas de restauraciÃ³n serÃ­a un
  riesgo mayor que usar Supabase.
- **RBAC mÃ­nimo.** La aplicaciÃ³n no necesita leer ni escribir objetos de
  Kubernetes, por eso no se crean Roles ni RoleBindings. El control de acceso de
  operadores y de ArgoCD se gestiona fuera de este repositorio.
- **Backstage no se instala completo.** El catÃ¡logo es vÃ¡lido y registrable,
  pero no se levanta el portal ni TechDocs. Es la alternativa que el propio PDF
  admite cuando la infraestructura no permite la plataforma completa.

### 4.3 Evidencias ejecutables

```bash
# Renderizado de overlays
kubectl kustomize deploy/k8s/overlays/local > build/local.yaml
kubectl kustomize deploy/k8s/overlays/production > build/production.yaml
kubectl kustomize deploy/observability > build/observability.yaml

# ValidaciÃ³n estÃ¡tica
bash deploy/scripts/validar-k8s.sh

# Despliegue local (Docker Desktop)
kubectl apply -k deploy/k8s/overlays/local
kubectl rollout status deployment/riki -n riki
kubectl rollout status deployment/riki-ai-gateway -n riki
kubectl port-forward -n riki svc/riki 8081:80
```

Con controladores instalados (Ingress, HPA y ArgoCD reales):

```bash
# Instala metrics-server, ingress-nginx y ArgoCD
bash deploy/scripts/demo-plataforma.sh plataforma

# Despliega el overlay que conserva Ingress, HPA, PDB y NetworkPolicy
bash deploy/scripts/demo-plataforma.sh app
bash deploy/scripts/demo-plataforma.sh verificar
```

Para `kind`:

```bash
kind create cluster --config deploy/kind/cluster.yaml
kind load docker-image riki:local-0.2.0 --name riki
kind load docker-image riki-ai-gateway:local-0.2.0 --name riki
kubectl apply -k deploy/k8s/overlays/local
```

---

## 5. MÃ³dulo 3 â€” DevSecOps y seguridad de la cadena de suministro

### 5.1 Matriz de contenidos

| Contenido del PDF | AplicaciÃ³n en Riki | Evidencia | Estado |
| --- | --- | --- | --- |
| Threat modeling bÃ¡sico | Modelo STRIDE con activos, actores, fronteras y riesgos residuales | `docs/security/modelo-de-amenazas.md` | Cubierto |
| GestiÃ³n de dependencias | Lockfiles, hashes, auditorÃ­a Python y frontend | `pnpm-lock.yaml`, `requirements.txt`, job `auditoria-dependencias` | Cubierto con hallazgos abiertos |
| Secretos | Sin claves en Git ni en el bundle; secreto de K8s; rotaciÃ³n documentada; `gitleaks` sobre todo el historial | `.gitignore`, `.dockerignore`, `docs/runbook.md`, job `secretos` | Cubierto |
| AnÃ¡lisis estÃ¡tico | `tsc --noEmit` y ESLint como gates del frontend; Ruff en el gateway | CI, `eslint.config.js` | Cubierto |
| AnÃ¡lisis de composiciÃ³n de software | Trivy, `pip-audit` y `pnpm audit` | CI y ejecuciÃ³n local | Cubierto |
| Vulnerabilidades de imÃ¡genes | Trivy sobre ambas imÃ¡genes con `CRITICAL,HIGH` | CI, `deploy/scripts/verificar-supply-chain.sh` | Cubierto |
| Hardening de contenedores | No root, rootfs de solo lectura, `cap_drop: ALL`, seccomp, sin escalada | Dockerfiles, Compose, manifiestos | Cubierto |
| ReducciÃ³n de superficie | Build multi-etapa; runtime sin toolchain de build; usuario sin privilegios | `Dockerfile`, `services/ai-gateway/Dockerfile` | Cubierto |
| SBOM | Syft en CI y local; SPDX JSON | CI, `deploy/scripts/verificar-supply-chain.sh` | Cubierto en CI |
| Procedencia | `provenance: true` y `sbom: true` en Buildx | CI | Cubierto en CI |
| Firma y verificaciÃ³n | Cosign keyless con identidad OIDC de GitHub Actions | CI, `deploy/README.md` Â§10.4 | Cubierto en CI |
| PolÃ­ticas de admisiÃ³n | conftest valida antes del despliegue y Kyverno refuerza la lÃ­nea base de pods y verifica la firma Cosign en admisiÃ³n | `deploy/policies/kubernetes.rego`, `deploy/security/kyverno/` | Cubierto (Kyverno requiere instalarse en el clÃºster) |
| SegregaciÃ³n de funciones | OIDC para GHCR, `GITHUB_TOKEN` de corta duraciÃ³n, ArgoCD separado del CI, `CODEOWNERS` y plantilla de PR con checklist | CI, `deploy/argocd/`, `.github/` | Parcial (falta activar la protecciÃ³n de rama en GitHub) |
| Vulnerabilidad, mala configuraciÃ³n y riesgo contextual | La bitÃ¡cora separa criticidad tÃ©cnica, explotabilidad y tratamiento | `docs/security/hallazgos.md` | Cubierto |
| Pipeline con lint, pruebas, build, escaneo y publicaciÃ³n | Jobs `validar-web` (tipos, lint, pruebas, build), `validar-gateway`, `secretos`, `validar-manifiestos`, `auditoria-dependencias` (vulnerabilidades y licencias), `imagen-web`, `imagen-gateway` | `.github/workflows/contenedor.yml` | Cubierto |
| Controles para cÃ³digo generado por IA | Pruebas, linters, SCA, escaneo de secretos y revisiÃ³n humana; sin trazabilidad completa de prompts | CI, `docs/security/registro-uso-ia.md` | Parcial |
| RevisiÃ³n de licencias | `pnpm licenses list` + `scripts/licencias.mjs`; bloquea GPL/AGPL en producciÃ³n | CI, `scripts/licencias.mjs` | Cubierto |

### 5.2 Controles y umbrales

| Control | Herramienta | Umbral actual |
| --- | --- | --- |
| Tipos del frontend | `tsc --noEmit` | Cualquier error falla |
| Lint del frontend | ESLint | Cualquier error falla; mÃ¡ximo 20 avisos |
| Pruebas del frontend | Vitest | 36 pruebas |
| Lint Python | Ruff | Cualquier hallazgo falla |
| Pruebas gateway | Pytest | 39 pruebas |
| Lint Dockerfile | Hadolint | `warning` |
| Esquema Kubernetes | kubeconform | `strict`; CRDs omitidos |
| Buenas prÃ¡cticas K8s | kube-linter | Cualquier error falla |
| PolÃ­ticas propias | conftest | 369 pruebas |
| Vulnerabilidades de imagen | Trivy | `CRITICAL,HIGH` corregibles |
| Dependencias Python | pip-audit | Cualquier vulnerabilidad conocida falla |
| Dependencias frontend | pnpm audit | CrÃ­ticas y altas bloquean |
| Secretos en el historial | gitleaks | Cualquier hallazgo falla |
| Licencias | `scripts/licencias.mjs` | GPL/AGPL fallan; el resto se reporta |
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
pnpm typecheck
pnpm lint
pnpm test
pnpm audit --prod --audit-level high
pnpm licenses list --prod --json > licencias.json
node scripts/licencias.mjs licencias.json

# Manifiestos
bash deploy/scripts/validar-k8s.sh

# ImÃ¡genes
bash deploy/scripts/verificar-supply-chain.sh
```

### 5.4 Resultados de referencia (2026-10-27)

| ValidaciÃ³n | Resultado |
| --- | --- |
| `pytest` | 39 pruebas aprobadas |
| `vitest` | 36 pruebas aprobadas |
| `tsc --noEmit` | Sin errores |
| `eslint` | 0 errores, 15 avisos |
| `ruff` | Sin hallazgos |
| `pnpm build` | Correcto |
| Hadolint | Sin hallazgos |
| Actionlint | Workflow vÃ¡lido |
| Shellcheck | Scripts sin advertencias |
| kubeconform | 25 recursos, 22 vÃ¡lidos, 3 CRDs omitidos |
| kube-linter | Sin errores |
| conftest | 369/369 |
| `docker compose config` | VÃ¡lido |
| Runtime Compose | `/healthz`, `/api/healthz`, modelos y chat real (HTTP 200) |
| Runtime K8s local | `/healthz` y `/api/healthz` por Ingress (HTTP 200); pods como UID 101 y 10001 con rootfs de solo lectura |
| HPA | EscalÃ³ de 1 a 2 rÃ©plicas con mÃ©tricas reales de metrics-server |
| ArgoCD | `Synced`/`Healthy`; una imagen cambiada a mano volviÃ³ al valor de Git en menos de 30 s |
| Trivy imÃ¡genes | 0 vulnerabilidades `HIGH`/`CRITICAL` corregibles |
| `pip-audit` | Sin vulnerabilidades conocidas |
| `pnpm audit --prod` | Sin vulnerabilidades conocidas |
| Licencias de producciÃ³n | Sin GPL/AGPL |
| gitleaks | Sin secretos en el historial |
| `kind` | ConfiguraciÃ³n incluida; no ejecutada en este entorno |

> El clÃºster de laboratorio (Docker Desktop v1.36.1) ya tiene `ingress-nginx`,
> `metrics-server` y ArgoCD instalados por `deploy/scripts/demo-plataforma.sh`.
> `kindnet` no aplica NetworkPolicy, asÃ­ que el aislamiento de trÃ¡fico sigue
> pendiente de un CNI que lo soporte. La firma Cosign y la publicaciÃ³n en GHCR
> solo se ejecutan en GitHub Actions.

---

## 6. Brechas y trabajo futuro

| Brecha | Impacto | Siguiente paso |
| --- | --- | --- |
| Sin clÃºster ni registro de producciÃ³n | Operativo | Repetir las validaciones en el entorno real antes del despliegue |
| NetworkPolicy no aplicada por `kindnet` | Medio | Repetir el laboratorio con Calico o Cilium |
| ProtecciÃ³n de rama no activada en GitHub | Medio | Exigir los jobs del workflow y una revisiÃ³n en `main` |
| Kyverno no instalado en el clÃºster de laboratorio | Medio | `kubectl apply -k deploy/security/kyverno` tras instalar Kyverno |
| Backstage no instalado | Bajo | El catÃ¡logo ya estÃ¡ listo para registrarse cuando exista portal |
| Rate limit por rÃ©plica | Bajo | Redis o un limitador compartido; ADR 0004 |
| Sin WAF ni protecciÃ³n DDoS de aplicaciÃ³n | Medio | Cloudflare/ingress-nginx con lÃ­mites y reglas |
| CSP con `unsafe-inline`/`unsafe-eval` por Tailwind CDN | Medio | Compilar Tailwind en build y endurecer CSP |
| Sin SBOM firmado como artefacto de release | Bajo | Adjuntar el SBOM al release y conservarlo |
| 15 avisos de ESLint (`exhaustive-deps`) | Bajo | Revisar dependencias de efectos uno por uno |
| IA local no implementada | Fuera de alcance | No aplica a este trabajo |

---

## 7. Checklist de entrega por mÃ³dulo

### MÃ³dulo 1

- [x] Repositorio Git con README y decisiones documentadas.
- [x] Dockerfile multi-etapa y usuario no root.
- [x] Docker Compose con servicio auxiliar y red interna.
- [x] Variables de ejemplo sin secretos reales.
- [x] Pruebas y linters ejecutables (`pytest`, `vitest`, `tsc`, ESLint, Ruff).
- [x] Build reproducible con lockfiles y digests.
- [x] DiagnÃ³stico de fallos de configuraciÃ³n documentado (`docs/laboratorio/fallo-inducido.md`).

### MÃ³dulo 2

- [x] Manifiestos Kubernetes con probes, lÃ­mites y seguridad.
- [x] Overlays por ambiente con Kustomize.
- [x] GitOps con ArgoCD, deriva y correcciÃ³n automÃ¡tica.
- [x] Estrategia de actualizaciÃ³n y rollback.
- [x] CatÃ¡logo mÃ­nimo de Backstage y golden path.
- [x] ConfiguraciÃ³n de clÃºster local con `kind`.
- [x] RBAC de solo lectura para el equipo.
- [x] Ingress y HPA verificados en runtime con controladores reales.

### MÃ³dulo 3

- [x] Modelo de amenazas.
- [x] BitÃ¡cora de hallazgos con tratamiento.
- [x] Pipeline con lint, pruebas, build, escaneo y publicaciÃ³n.
- [x] SBOM, procedencia y firma keyless.
- [x] Hardening de contenedores y polÃ­ticas pre-despliegue.
- [x] AuditorÃ­a de dependencias Python y frontend.
- [x] Dependencias altas actualizadas (`react-router`, `zod`, `ws`).
- [x] Escaneo de secretos en el historial con gitleaks.
- [x] RevisiÃ³n automatizada de licencias.
- [x] Acciones de GitHub fijadas por SHA y actualizaciÃ³n con Dependabot.
- [x] Admission controller con Kyverno y verificaciÃ³n de firma.

---

## 8. Referencias

- `deploy/README.md` â€” guÃ­a operativa completa.
- `docs/runbook.md` â€” incidentes, rotaciÃ³n y rollback.
- `docs/adr/` â€” decisiones de arquitectura.
- `docs/security/modelo-de-amenazas.md` â€” anÃ¡lisis de riesgos.
- `docs/security/hallazgos.md` â€” bitÃ¡cora de seguridad.
- `docs/security/registro-uso-ia.md` â€” registro de software asistido por IA.
- `docs/laboratorio/fallo-inducido.md` â€” prÃ¡ctica de diagnÃ³stico del mÃ³dulo 1.
- `docs/laboratorio/modulo-2-runtime.md` â€” evidencias de clÃºster del mÃ³dulo 2.
- `deploy/security/kyverno/` â€” polÃ­ticas de admisiÃ³n.
- `docs/plataforma/catalogo-backstage.md` â€” catÃ¡logo y golden path.
- `deploy/kind/README.md` â€” clÃºster local reproducible.
- `.github/workflows/contenedor.yml` â€” pipeline de CI/CD.
