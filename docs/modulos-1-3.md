# Aplicación de los módulos 1–3 de CloudForge AI 5.0 a Tuki

Este documento traza qué contenidos de los módulos **1 (fundamentos Cloud
Native, Linux, Git y contenedores)**, **2 (Kubernetes, GitOps y Platform
Engineering)** y **3 (DevSecOps y cadena de suministro)** se aplicaron al
proyecto Tuki, con qué artefacto se demuestran y qué queda fuera de alcance.

Criterio de esta iteración: **aprovechar lo que el proyecto ya tenía y añadir
solo evidencias ligeras y verificables**. No se reescribió el producto, no se
instaló una plataforma completa y no se implementó IA local.

> **Fuera de alcance explícito:** módulos 5 y 6 (MLOps/LLMOps e IA local
> multimodal) y el componente de IA local del proyecto integrador. Tuki usa un
> proveedor gestionado (Groq) a través de un gateway propio; no sirve modelos en
> el clúster.

---

## 1. Resumen de cobertura

| Módulo | Peso en el diplomado | Cobertura en Tuki | Evidencia principal |
| --- | --- | --- | --- |
| 1. Fundamentos Cloud Native, Linux, Git y contenedores | 10 % | **Cubierto** | `Dockerfile`, `docker-compose.yml`, lockfiles, `.dockerignore`, ADR de cadena de suministro |
| 2. Kubernetes, GitOps y Platform Engineering | 15 % | **Cubierto con adaptaciones** | `deploy/k8s/base`, overlays `local` y `production`, ArgoCD, `catalog-info.yaml`, `deploy/kind/` |
| 3. DevSecOps y cadena de suministro | 15 % | **Cubierto con brechas documentadas** | CI, Trivy, Syft, Cosign, conftest, modelo de amenazas y bitácora de hallazgos |

Adaptaciones conscientes:

- **Servicios gestionados en lugar de estado en el clúster.** Supabase,
  Supabase Storage y Groq no se containerizan. Ver `docs/adr/0003-servicios-gestionados.md`.
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

### 2.1 Segunda iteración: cerrar brechas del alcance 1–3

| Archivo | Propósito |
| --- | --- |
| `tests/frontend/` | 36 pruebas de Vitest sobre contraste WCAG, slugs y formato de precio |
| `eslint.config.js` | Lint del frontend como gate de CI |
| `scripts/licencias.mjs` | Revisión de licencias de producción; bloquea GPL/AGPL |
| `.github/workflows/contenedor.yml` | Gates de `tsc`, ESLint y Vitest; job `secretos` con gitleaks; licencias; acciones fijadas por SHA |
| `.github/dependabot.yml` | Actualización semanal de npm, pip, acciones y Dockerfiles |
| `.github/CODEOWNERS`, `PULL_REQUEST_TEMPLATE.md` | Propiedad del código y checklist de seguridad en cada PR |
| `deploy/security/kyverno/` | Línea base de pods y verificación de firma Cosign en admisión |
| `deploy/k8s/overlays/local-plataforma` | Overlay con Ingress, HPA, PDB y NetworkPolicy para clústeres con controladores |
| `deploy/k8s/base/rbac.yaml` | Rol de solo lectura para el equipo, sin acceso a Secretos |
| `deploy/scripts/demo-plataforma.sh` | Instala metrics-server, ingress-nginx y ArgoCD y demuestra el módulo 2 |
| `deploy/argocd/application-laboratorio.yaml` | Application de laboratorio con `selfHeal` y excepción de réplicas para el HPA |
| `docs/laboratorio/fallo-inducido.md` | Práctica del módulo 1 con síntoma, diagnóstico y restauración |
| `docs/laboratorio/modulo-2-runtime.md` | Evidencias reales de Ingress, HPA, ArgoCD y endurecimiento |

También se retiró del CSP el origen `generativelanguage.googleapis.com`, que ya
no usa la aplicación tras eliminar la integración con Gemini.

### 2.2 Revisión de cierre (2026-10-27)

| Archivo | Cambio |
| --- | --- |
| `.gitattributes` | Fuerza `LF` en scripts de shell y `CRLF` en PowerShell; evita que Git rompa el shebang en Windows |
| `scripts/verificar-proyecto.mjs` | Puerta local: 11 pasos de los módulos 1–3 en una sola orden (`pnpm verificar`) |
| `scripts/validar-catalogo.py` | Validación del catálogo compartida por la CI y la estación local |
| `deploy/scripts/validar-k8s.sh` | Detecta Git Bash y traduce rutas para Docker Desktop |
| `.github/workflows/contenedor.yml` | Atestación Cosign del SBOM de ambas imágenes y verificación de la atestación |
| `docs/modulos-1-3.md`, `docs/security/hallazgos.md`, `deploy/k8s/overlays/local-plataforma/kustomization.yaml` | Recodificados a UTF-8 (tenían texto doblemente codificado) |
| `deploy/security/kyverno/` | Políticas migradas a `ValidatingPolicy` e `ImageValidatingPolicy` (API CEL, Kyverno 1.19+) y pruebas de conformidad |
| `deploy/scripts/validar-kyverno.sh` | Comprueba con la CLI que el pod conforme pasa y el inseguro se rechaza |

---

## 3. Módulo 1 — Fundamentos Cloud Native, Linux, Git y contenedores

### 3.1 Matriz de contenidos

| Contenido del PDF | Aplicación en Tuki | Evidencia | Estado |
| --- | --- | --- | --- |
| Terminal, procesos, puertos, DNS, HTTP y TLS | Flujo navegador → Ingress/Nginx → gateway; puertos 8080 y 8000; TLS en Ingress | `deploy/README.md` §1, `docker/nginx/conf.d/default.conf`, `deploy/k8s/base/ingress.yaml` | Cubierto |
| Virtualización frente a contenedores; namespaces y cgroups | Contenedores sin privilegios, límites de CPU/memoria y rootfs de solo lectura | `Dockerfile`, `services/ai-gateway/Dockerfile`, `docker-compose.yml` | Cubierto |
| Imágenes, capas y registries | Build multi-etapa; imagen publicada en GHCR; bases fijadas por digest | `Dockerfile`, `.github/workflows/contenedor.yml`, `docs/adr/0002-cadena-de-suministro.md` | Cubierto |
| Volúmenes y redes de contenedor | Red interna de Compose; `/tmp` efímero; sin volúmenes persistentes | `docker-compose.yml`, `deploy/k8s/base/deployment.yaml` | Cubierto |
| Configuración externa y secretos de laboratorio | Variables `VITE_*` en build; `GROQ_API_KEY` solo en runtime; plantillas `.env.example` | `deploy/README.md` §4, `.env.example`, `services/ai-gateway/.env.example` | Cubierto |
| Doce factores | Aplicación sin estado, configuración por entorno, logs a stdout, puertos explícitos, procesos descartables | Ver tabla 3.2 | Cubierto con matices |
| Construcción reproducible | `pnpm-lock.yaml`, `requirements.txt` con hashes, `--frozen-lockfile`, bases por digest | `pnpm-lock.yaml`, `services/ai-gateway/requirements.txt`, CI | Cubierto |
| Docker Compose con dependencias | `frontend` + `backend`; Supabase (datos y Storage)/Groq como servicios gestionados | `docker-compose.yml`, ADR 0003 | Cubierto con adaptación |
| Pruebas y validación | `pytest` (39 pruebas), `vitest` (36 pruebas), `tsc --noEmit`, ESLint, Ruff, build de Vite, Hadolint | CI, `services/ai-gateway/tests/`, `tests/frontend/` | Cubierto |
| Inspección de tamaño, puertos, procesos y recursos | Límites en Compose/K8s, imágenes multi-etapa, usuario no root | `docker-compose.yml`, manifiestos, `deploy/scripts/verificar-supply-chain.sh` | Cubierto |
| Microproyecto con README, Dockerfile, Compose, variables de ejemplo, pruebas y decisiones | Todo presente en el repositorio | `README.md`, `deploy/README.md`, `docs/adr/`, tests | Cubierto |

### 3.2 Doce factores en Tuki

| Factor | Cómo se cumple |
| --- | --- |
| 1. Código base versionado | Repositorio Git único con frontend, gateway, despliegue y documentación |
| 2. Dependencias declaradas | `pnpm-lock.yaml` y `requirements.txt` con hashes |
| 3. Configuración en el entorno | `VITE_*` en build; variables del gateway en runtime; sin configuración hardcodeada de secretos |
| 4. Servicios de respaldo | Supabase (datos y Storage) y Groq se tratan como recursos externos sustituibles |
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

| Contenido del PDF | Aplicación en Tuki | Evidencia | Estado |
| --- | --- | --- | --- |
| Clúster local con kind, minikube o k3d | Configuración reproducible de `kind`; el runtime validado fue Docker Desktop | `deploy/kind/cluster.yaml`, `deploy/kind/README.md` | Cubierto (kind no ejecutado en este entorno) |
| Modelo declarativo y reconciliación | Manifiestos declarativos; ArgoCD con `selfHeal` y `prune` | `deploy/k8s/`, `deploy/argocd/application-production.yaml` | Cubierto |
| Pods, Deployments, ReplicaSets | Dos Deployments con rolling update, probes y réplicas | `deploy/k8s/base/deployment.yaml`, `ai-gateway-deployment.yaml` | Cubierto |
| StatefulSets, DaemonSets, Jobs y CronJobs | No se usan en la aplicación: no hay estado local ni tareas programadas | ADR 0003 | No aplica |
| Services e Ingress | `Service` ClusterIP e Ingress con `/` y `/api`; verificado en runtime con ingress-nginx (`/healthz` y `/api/healthz` responden 200) | `deploy/k8s/base/ingress.yaml`, `deploy/k8s/overlays/local-plataforma`, `docs/laboratorio/modulo-2-runtime.md` | Cubierto |
| ConfigMaps y Secrets | ConfigMap del gateway y secreto `tuki-ai-gateway` fuera de Git | `ai-gateway-configmap.yaml`, `ai-gateway-secret.example.yaml` | Cubierto |
| PersistentVolumes y StorageClass | No aplica: datos e imágenes en Supabase (Postgres y Storage) | ADR 0003 y 0008 | No aplica |
| Namespaces y RBAC | Namespace `tuki`; ServiceAccount sin token; `Role`/`RoleBinding` de solo lectura (pods, logs, deployments, ingress) para el grupo de desarrolladores, sin acceso a Secretos | `namespace.yaml`, `serviceaccount.yaml`, `rbac.yaml` | Cubierto |
| Requests, limits y probes | Límites, `liveness`/`readiness`/`startup` y recursos por contenedor | Deployments y HPA | Cubierto |
| Autoscaling, PDB y alta disponibilidad | HPA 2–20 con métricas reales de metrics-server (escaló de 1 a 2 réplicas), PDB `minAvailable: 1`, topología y anti-affinity | `hpa.yaml`, `pdb.yaml`, Deployments, `docs/laboratorio/modulo-2-runtime.md` | Cubierto en runtime |
| NetworkPolicy | Aísla web/gateway y restringe egreso a 443 y DNS | `networkpolicy.yaml` | Cubierto en producción; desactivado en local |
| Actualización y rollback | Rolling update, `kubectl rollout undo`, rollback de ArgoCD | `docs/runbook.md`, `deploy/README.md` §12 | Cubierto |
| Helm o Kustomize | Kustomize con base y overlays por ambiente | `deploy/k8s/base`, `overlays/local`, `overlays/production` | Cubierto con adaptación |
| Registro local o institucional | GHCR para imágenes firmadas; `kind load` para imágenes locales | CI, `deploy/kind/README.md` | Cubierto con adaptación |
| GitOps con ArgoCD | Aplicaciones `tuki-local`, `tuki-production` y `tuki-laboratorio`; sync, deriva y `selfHeal` demostrados en runtime | `deploy/argocd/`, `docs/laboratorio/modulo-2-runtime.md` §7 | Cubierto en runtime |
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
kubectl rollout status deployment/tuki -n tuki
kubectl rollout status deployment/tuki-ai-gateway -n tuki
kubectl port-forward -n tuki svc/tuki 8081:80
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
kind load docker-image tuki:local-0.2.0 --name tuki
kind load docker-image tuki-ai-gateway:local-0.2.0 --name tuki
kubectl apply -k deploy/k8s/overlays/local
```

---

## 5. Módulo 3 — DevSecOps y seguridad de la cadena de suministro

### 5.1 Matriz de contenidos

| Contenido del PDF | Aplicación en Tuki | Evidencia | Estado |
| --- | --- | --- | --- |
| Threat modeling básico | Modelo STRIDE con activos, actores, fronteras y riesgos residuales | `docs/security/modelo-de-amenazas.md` | Cubierto |
| Gestión de dependencias | Lockfiles, hashes, auditoría Python y frontend | `pnpm-lock.yaml`, `requirements.txt`, job `auditoria-dependencias` | Cubierto con hallazgos abiertos |
| Secretos | Sin claves en Git ni en el bundle; secreto de K8s; rotación documentada; `gitleaks` sobre todo el historial | `.gitignore`, `.dockerignore`, `docs/runbook.md`, job `secretos` | Cubierto |
| Análisis estático | `tsc --noEmit` y ESLint como gates del frontend; Ruff en el gateway | CI, `eslint.config.js` | Cubierto |
| Análisis de composición de software | Trivy, `pip-audit` y `pnpm audit` | CI y ejecución local | Cubierto |
| Vulnerabilidades de imágenes | Trivy sobre ambas imágenes con `CRITICAL,HIGH` | CI, `deploy/scripts/verificar-supply-chain.sh` | Cubierto |
| Hardening de contenedores | No root, rootfs de solo lectura, `cap_drop: ALL`, seccomp, sin escalada | Dockerfiles, Compose, manifiestos | Cubierto |
| Reducción de superficie | Build multi-etapa; runtime sin toolchain de build; usuario sin privilegios | `Dockerfile`, `services/ai-gateway/Dockerfile` | Cubierto |
| SBOM | Syft en CI y local; SPDX JSON | CI, `deploy/scripts/verificar-supply-chain.sh` | Cubierto en CI |
| Procedencia | `provenance: true` y `sbom: true` en Buildx | CI | Cubierto en CI |
| Firma y verificación | Cosign keyless con identidad OIDC de GitHub Actions | CI, `deploy/README.md` §10.4 | Cubierto en CI |
| Políticas de admisión | conftest valida antes del despliegue y Kyverno refuerza la línea base de pods y verifica la firma Cosign en admisión | `deploy/policies/kubernetes.rego`, `deploy/security/kyverno/`, `deploy/scripts/validar-kyverno.sh` | Cubierto (políticas en la API CEL de Kyverno 1.19+ y probadas con la CLI; falta instalarlo en el clúster) |
| Segregación de funciones | OIDC para GHCR, `GITHUB_TOKEN` de corta duración, ArgoCD separado del CI, `CODEOWNERS` y plantilla de PR con checklist | CI, `deploy/argocd/`, `.github/` | Parcial (falta activar la protección de rama en GitHub) |
| Vulnerabilidad, mala configuración y riesgo contextual | La bitácora separa criticidad técnica, explotabilidad y tratamiento | `docs/security/hallazgos.md` | Cubierto |
| Pipeline con lint, pruebas, build, escaneo y publicación | Jobs `validar-web` (tipos, lint, pruebas, build), `validar-gateway`, `secretos`, `validar-manifiestos`, `auditoria-dependencias` (vulnerabilidades y licencias), `imagen-web`, `imagen-gateway` | `.github/workflows/contenedor.yml` | Cubierto |
| Controles para código generado por IA | Pruebas, linters, SCA, escaneo de secretos y revisión humana; sin trazabilidad completa de prompts | CI, `docs/security/registro-uso-ia.md` | Parcial |
| Revisión de licencias | `pnpm licenses list` + `scripts/licencias.mjs`; bloquea GPL/AGPL en producción | CI, `scripts/licencias.mjs` | Cubierto |

### 5.2 Controles y umbrales

| Control | Herramienta | Umbral actual |
| --- | --- | --- |
| Tipos del frontend | `tsc --noEmit` | Cualquier error falla |
| Lint del frontend | ESLint | Cualquier error falla; máximo 20 avisos |
| Pruebas del frontend | Vitest | 36 pruebas |
| Lint Python | Ruff | Cualquier hallazgo falla |
| Pruebas gateway | Pytest | 39 pruebas |
| Lint Dockerfile | Hadolint | `warning` |
| Esquema Kubernetes | kubeconform | `strict`; CRDs omitidos |
| Buenas prácticas K8s | kube-linter | Cualquier error falla |
| Políticas propias | conftest | 369 pruebas |
| Vulnerabilidades de imagen | Trivy | `CRITICAL,HIGH` corregibles |
| Dependencias Python | pip-audit | Cualquier vulnerabilidad conocida falla |
| Dependencias frontend | pnpm audit | Críticas y altas bloquean |
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

# Imágenes
bash deploy/scripts/verificar-supply-chain.sh
```

### 5.4 Resultados de referencia (verificados el 2026-10-27)

| Validación | Resultado | Dónde |
| --- | --- | --- |
| `pnpm verificar` | 11 de 11 pasos aprobados | Local |
| `tsc --noEmit` | Sin errores | Local y CI |
| `eslint` | 0 errores, 15 avisos | Local y CI |
| `vitest` | 36 pruebas aprobadas | Local y CI |
| `pnpm build` | Correcto (~10 s) | Local y CI |
| `ruff` | Sin hallazgos | Local y CI |
| `pytest` | 39 pruebas aprobadas | Local y CI |
| Actionlint | Workflow válido | Local |
| kubeconform | 45 recursos, 42 válidos, 3 CRDs omitidos | Local |
| kube-linter | Sin errores | Local |
| conftest | 225/225 | Local |
| Catálogo de Backstage | 8 entidades y referencias correctas | Local y CI |
| `docker compose config` | Válido | Local |
| Runtime Compose | Build de 63 s; `/healthz` 200, `/api/healthz` 200, `/readyz` correcto; 9,8 MiB (web) y 46,7 MiB (gateway) en reposo | Local |
| Runtime K8s local | Ingress `tuki.localhost`: `/healthz` y `/api/healthz` responden 200; pods como UID 101 y 10001, rootfs de solo lectura y `capabilities.drop: [ALL]` | Local |
| HPA | `tuki` y `tuki-ai-gateway` con 2 réplicas y CPU real (5–6 % de 70 %); mínimo 2, máximo 10 en la base y 20 en producción | Local |
| PDB | `minAvailable: 1` en ambos Deployments | Local |
| NetworkPolicy y RBAC | 2 NetworkPolicy y `Role`/`RoleBinding` de lectura aplicados | Local |
| Kyverno | 4 controladores `Running`; `linea-base-pods-tuki` en `READY`; el pod inseguro se rechaza en admisión | Local |
| Trivy imágenes | 0 vulnerabilidades `HIGH`/`CRITICAL` corregibles | CI |
| `pip-audit` y `pnpm audit` | Sin vulnerabilidades conocidas | CI |
| Licencias de producción | Sin GPL/AGPL | CI |
| gitleaks | Sin secretos en el historial | CI |
| Cosign y SBOM | Firma keyless, verificación y atestación SPDX de ambas imágenes | CI (push y tag) |
| ArgoCD | `Synced`/`Healthy` y corrección de deriva en menos de 30 s; las Applications deben reaplicarse tras reiniciar el clúster | Local |
| `kind` | Configuración incluida; no ejecutada en este entorno | — |

> El clúster de laboratorio (Docker Desktop v1.36.1) tiene `ingress-nginx`,
> `metrics-server` y ArgoCD instalados por `deploy/scripts/demo-plataforma.sh`.
> `kindnet` no aplica NetworkPolicy, así que el aislamiento de tráfico sigue
> pendiente de un CNI que lo soporte. La firma Cosign, el SBOM y la publicación
> en GHCR solo se ejecutan en GitHub Actions. Las Applications de ArgoCD no
> están registradas ahora mismo: `bash deploy/scripts/demo-plataforma.sh
> plataforma app` las vuelve a crear.

---

## 6. Brechas y trabajo futuro

### 6.1 Cerradas en la revisión del 2026-10-27

| Brecha | Cierre aplicado |
| --- | --- |
| Tres documentos con acentos doblemente codificados | Recodificados a UTF-8 sin pérdida: `docs/modulos-1-3.md`, `docs/security/hallazgos.md` y `deploy/k8s/overlays/local-plataforma/kustomization.yaml` |
| Scripts de validación pensados solo para Linux | `deploy/scripts/validar-k8s.sh` detecta Git Bash, usa la ruta del host (`cygpath -m`) y desactiva la conversión de rutas de MSYS |
| Saltos de línea inconsistentes en scripts | `.gitattributes` fuerza `eol=lf` en `.sh` y `eol=crlf` en `.ps1` |
| Verificación repartida en muchos comandos | `pnpm verificar` ejecuta los 11 pasos con código de salida |
| Catálogo validado solo en CI | `scripts/validar-catalogo.py`, usado por la CI y por la verificación local |
| SBOM sin atestación ligada a la imagen | `cosign attest` y `cosign verify-attestation` del SPDX de ambas imágenes |
| Resultados de referencia desactualizados | Tabla 5.4 sincronizada con la ejecución real (225 pruebas de conftest, 45 recursos) |
| Kyverno no instalado en el clúster de laboratorio | Instalado (1.19.2): 4 controladores en `Running`, política `READY` y rechazo real de un pod inseguro |

### 6.2 Abiertas

| Brecha | Impacto | Siguiente paso |
| --- | --- | --- |
| Sin clúster ni registro de producción | Operativo | Repetir las validaciones en el entorno real antes del despliegue |
| NetworkPolicy no aplicada por `kindnet` | Medio | Repetir el laboratorio con Calico o Cilium |
| Protección de rama no activada en GitHub | Medio | Bloqueada por el plan: repositorio privado + GitHub Free devuelve 403. `scripts/configurar-proteccion-rama.sh` la aplica tras pasar a Pro o a repositorio público |
| Backstage no instalado | Bajo | El catálogo ya está listo para registrarse cuando exista portal |
| Rate limit por réplica | Bajo | Redis o un limitador compartido; ADR 0004 |
| Sin WAF ni protección DDoS de aplicación | Medio | Cloudflare/ingress-nginx con límites y reglas |
| CSP con `unsafe-inline`/`unsafe-eval` por Tailwind CDN | Medio | Compilar Tailwind en build y endurecer CSP |
| 15 avisos de ESLint (`exhaustive-deps`) | Bajo | Revisar dependencias de efectos uno por uno |
| IA local no implementada | Fuera de alcance | No aplica a este trabajo |

---

## 7. Checklist de entrega por módulo

### Módulo 1

- [x] Repositorio Git con README y decisiones documentadas.
- [x] Dockerfile multi-etapa y usuario no root.
- [x] Docker Compose con servicio auxiliar y red interna.
- [x] Variables de ejemplo sin secretos reales.
- [x] Pruebas y linters ejecutables (`pytest`, `vitest`, `tsc`, ESLint, Ruff).
- [x] Build reproducible con lockfiles y digests.
- [x] Diagnóstico de fallos de configuración documentado (`docs/laboratorio/fallo-inducido.md`).

### Módulo 2

- [x] Manifiestos Kubernetes con probes, límites y seguridad.
- [x] Overlays por ambiente con Kustomize.
- [x] GitOps con ArgoCD, deriva y corrección automática.
- [x] Estrategia de actualización y rollback.
- [x] Catálogo mínimo de Backstage y golden path.
- [x] Configuración de clúster local con `kind`.
- [x] RBAC de solo lectura para el equipo.
- [x] Ingress y HPA verificados en runtime con controladores reales.

### Módulo 3

- [x] Modelo de amenazas.
- [x] Bitácora de hallazgos con tratamiento.
- [x] Pipeline con lint, pruebas, build, escaneo y publicación.
- [x] SBOM, procedencia y firma keyless.
- [x] Hardening de contenedores y políticas pre-despliegue.
- [x] Auditoría de dependencias Python y frontend.
- [x] Dependencias altas actualizadas (`react-router`, `zod`, `ws`).
- [x] Escaneo de secretos en el historial con gitleaks.
- [x] Revisión automatizada de licencias.
- [x] Acciones de GitHub fijadas por SHA y actualización con Dependabot.
- [x] Admission controller con Kyverno y verificación de firma.

### Transversal

- [x] Verificación en una sola orden (`pnpm verificar`).
- [x] Scripts de validación reproducibles en Linux y en Windows.
- [x] Documentos y manifiestos en UTF-8, sin texto dañado.
- [x] SBOM atestiguado con la firma de la imagen.

---

## 8. Verificación reproducible

Una sola orden ejecuta la misma puerta de calidad en cualquier estación:

```bash
pnpm verificar
```

Pasos: `tsc`, ESLint, Vitest, build de Vite, Ruff, Pytest, los cuatro
`kubectl kustomize` y la validación del catálogo. Devuelve código 1 si algo
falla y detalla el paso.

La parte que depende de Docker se ejecuta aparte, porque descarga imágenes de
validadores:

```bash
bash deploy/scripts/validar-k8s.sh          # kubeconform + kube-linter + conftest
bash deploy/scripts/verificar-supply-chain.sh   # hadolint + Trivy + Syft
```

Ambos scripts funcionan en Linux y en Git Bash sobre Windows. En Windows, si
`bash` apunta al WSL sin distribución instalada, invoca el de Git:

```powershell
& "C:\Program Files\Git\bin\bash.exe" deploy/scripts/validar-k8s.sh
```

Evidencia de runtime (módulo 1 y 2):

```bash
docker compose --env-file .env.local up -d --build
curl -i http://localhost:8080/healthz
curl -s http://localhost:8080/api/healthz
kubectl -n tuki get deploy,hpa,pdb,networkpolicy
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: tuki.localhost" http://localhost/healthz
```

---

## 9. Referencias

- `deploy/README.md` — guía operativa completa.
- `docs/runbook.md` — incidentes, rotación y rollback.
- `docs/auditoria-modulos-1-3.md` — auditoría de requerimientos y evidencias.
- `docs/adr/` — decisiones de arquitectura.
- `docs/security/modelo-de-amenazas.md` — análisis de riesgos.
- `docs/security/hallazgos.md` — bitácora de seguridad.
- `docs/security/registro-uso-ia.md` — registro de software asistido por IA.
- `docs/laboratorio/fallo-inducido.md` — práctica de diagnóstico del módulo 1.
- `docs/laboratorio/modulo-2-runtime.md` — evidencias de clúster del módulo 2.
- `deploy/security/kyverno/` — políticas de admisión.
- `docs/plataforma/catalogo-backstage.md` — catálogo y golden path.
- `deploy/kind/README.md` — clúster local reproducible.
- `.github/workflows/contenedor.yml` — pipeline de CI/CD.
