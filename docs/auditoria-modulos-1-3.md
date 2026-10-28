# Auditoría de los módulos 1–3

Revisión del repositorio contra los requerimientos técnicos de los módulos 1, 2
y 3 de CloudForge AI 5.0. Fecha: **2026-10-27**. Método: lectura de los
artefactos y ejecución de las validaciones en una estación Windows con Docker
Desktop y un clúster local.

> **IA local queda fuera de alcance** por decisión del proyecto: Tuki consume
> Groq a través de un gateway propio y no sirve modelos en el clúster.

## 1. Veredicto

| Módulo | Estado | Observación |
| --- | --- | --- |
| 1. Fundamentos y contenedores | **Cumple** | Dockerfile multi-etapa, usuario sin privilegios, `.dockerignore`, Compose con servicio auxiliar y empaquetado reproducible |
| 2. Kubernetes y GitOps | **Cumple** | Deployment, Service, ConfigMap, Secret (plantilla), Ingress, Kustomize, límites y ArgoCD |
| 3. DevSecOps y cadena de suministro | **Cumple** | CI/CD con lint, pruebas, Trivy, SBOM, firma y políticas de admisión |

No falta ningún archivo obligatorio del temario. La única corrección funcional
encontrada fue la **API de Kyverno**: las políticas usaban `kyverno.io/v1`, que
Kyverno 1.20 ya no acepta para escritura. Están migradas a `policies.kyverno.io/v1`
y verificadas con la CLI.

## 2. Módulo 1 — Fundamentos y contenedores

| Requerimiento | Estado | Evidencia |
| --- | --- | --- |
| Dockerfile multi-etapa | Sí | `Dockerfile` (`deps` → `build` → `runtime`) y `services/ai-gateway/Dockerfile` (`builder` → `runtime`) |
| Usuario no root | Sí | `USER 101:101` en la web; `USER 10001:10001` en el gateway; `runAsNonRoot` en Kubernetes |
| `.dockerignore` | Sí | Excluye `.git`, `node_modules`, `dist`, `.env*`, `docs`, `services` y material de agente |
| Compose para dependencias | Sí, con adaptación | `docker-compose.yml`: `frontend` + `backend` con `healthcheck` y `depends_on`. La base de datos es Supabase gestionado (ADR 0003), no un contenedor |
| Variables de entorno | Sí | `.env.example` y `services/ai-gateway/.env.example`; `VITE_*` en build, `GROQ_API_KEY` solo en runtime |
| Empaquetado reproducible | Sí | `pnpm-lock.yaml`, `requirements.txt` con hashes, bases fijadas por digest, `--frozen-lockfile` |
| Imágenes pequeñas y endurecidas | Sí | Web 98,6 MB y gateway 280 MB; sin toolchain en runtime, `cap_drop: ALL`, rootfs de solo lectura |

## 3. Módulo 2 — Kubernetes y GitOps

| Requerimiento | Estado | Evidencia |
| --- | --- | --- |
| Deployment | Sí | `deploy/k8s/base/deployment.yaml`, `ai-gateway-deployment.yaml` |
| Service | Sí | `service.yaml`, `ai-gateway-service.yaml` |
| ConfigMap | Sí | `ai-gateway-configmap.yaml` |
| Secret | Sí, como plantilla | `ai-gateway-secret.example.yaml` fuera de Kustomize; el secreto real se crea fuera de Git |
| Ingress | Sí | `ingress.yaml` con TLS y rutas `/` y `/api` |
| Helm o Kustomize | Sí | Kustomize con base y overlays `local`, `local-plataforma`, `production` |
| Requests y limits | Sí | CPU y memoria por contenedor en ambos Deployments; HPA 2–10 (20 en producción) |
| GitOps | Sí | `deploy/argocd/application-production.yaml` con `selfHeal`, `prune`, `ignoreDifferences` para el HPA |
| Endurecimiento | Sí | `automountServiceAccountToken: false`, `seccompProfile`, `readOnlyRootFilesystem`, `allowPrivilegeEscalation: false` |

## 4. Módulo 3 — DevSecOps y cadena de suministro

| Requerimiento | Estado | Evidencia |
| --- | --- | --- |
| Pipeline CI/CD | Sí | `.github/workflows/contenedor.yml` (calidad, manifiestos, imágenes, publicación) |
| Linters | Sí | ESLint, `tsc`, Ruff, Hadolint, actionlint, shellcheck, kube-linter, conftest |
| Pruebas automatizadas | Sí | 36 pruebas de Vitest y 39 de Pytest en cada push y PR |
| Escaneo de vulnerabilidades | Sí | Trivy en imágenes y en el repositorio (`vuln,secret,misconfig`) |
| SBOM | Sí | Syft en formato SPDX, publicado como artefacto y atestiguado con Cosign |
| Firma y verificación | Sí | Cosign keyless con identidad OIDC de GitHub Actions |
| Gestión de secretos | Sí | gitleaks en todo el historial; secretos fuera de Git |
| Políticas de admisión | Sí | Kyverno 1.19 instalado en el laboratorio, `ValidatingPolicy` activa (`READY`) e `ImageValidatingPolicy` lista para producción; conftest antes del despliegue |
| Dependencias | Sí | Dependabot (npm, pip, GitHub Actions y Docker) y `pip-audit`/`pnpm audit` |
| Código generado por IA | Sí | `docs/security/registro-uso-ia.md` con controles y validación |

## 5. Correcciones aplicadas en esta auditoría

| Cambio | Motivo |
| --- | --- |
| `deploy/security/kyverno/linea-base-pods.yaml` | Migrada de `ClusterPolicy` a `ValidatingPolicy` (CEL) |
| `deploy/security/kyverno/verificar-firmas.yaml` | Migrada a `ImageValidatingPolicy` con `mutateDigest` y `verifyDigest` |
| `deploy/security/kyverno/tests/` | Pods de prueba: uno conforme y uno inseguro |
| `deploy/scripts/validar-kyverno.sh` | Prueba las políticas sin clúster con la CLI oficial |
| `.github/workflows/contenedor.yml` | La CI ejecuta la validación de Kyverno dentro de `validar-manifiestos` |
| `docs/modulos-1-3.md`, `docs/security/hallazgos.md` | Estado de Kyverno y resultados sincronizados |
| `scripts/configurar-proteccion-rama.sh` | Aplica la protección de `main` con checks, revisión y sin force push |

### 5.1 Kyverno en el clúster de laboratorio

Instalado el 2026-10-27 en `docker-desktop` (Kyverno 1.19.2). Evidencia:

- Cuatro controladores `Running`: admisión, background, cleanup y reports.
- `linea-base-pods-tuki` en estado `READY`.
- Un pod conforme se admitió; uno inseguro fue rechazado por el webhook:

```text
admission webhook "vpol.validate.kyverno.svc-fail-finegrained-linea-base-pods-tuki" denied the request:
Policy linea-base-pods-tuki failed: El pod debe ejecutarse sin privilegios, sin escalada,
con rootfs de solo lectura y con todas las capacidades retiradas.
```

La política de firmas **no** se aplicó en el laboratorio: las imágenes locales
(`tuki:local-0.3.0`) no están firmadas y bloquearían cualquier despliegue. Se
aplica cuando el clúster consume las imágenes firmadas de GHCR.

> Nota operativa: `reg.kyverno.io` fallaba al descargar desde el contenedor del
> nodo. La instalación se hizo con el mismo manifiesto apuntando a
> `ghcr.io/kyverno/*`, que sí responde.

## 6. Lo que no está y por qué

| Elemento | Estado | Motivo |
| --- | --- | --- |
| Protección de rama en GitHub | Bloqueada por el plan | Repositorio privado con GitHub Free: la API responde 403 «Upgrade to GitHub Pro or make this repository public». El script `scripts/configurar-proteccion-rama.sh` queda listo para cuando se cambie de plan o de visibilidad |
| Kyverno instalado en el clúster | Pendiente | Hace falta instalarlo; las políticas ya están listas y probadas |
| NetworkPolicy efectiva | Pendiente | `kindnet` no aplica políticas; requiere Calico o Cilium |
| CSP estricta | Pendiente | Tailwind se carga por CDN y exige `unsafe-inline`/`unsafe-eval` |
| WAF y rate limit compartido | Pendiente | Decisión de infraestructura (Cloudflare, Redis) |
| Base de datos en Compose | No aplica | Supabase es gestionado por decisión documentada (ADR 0003) |

## 7. Cómo reproducir la auditoría

```bash
pnpm verificar                                  # 11 pasos: tipos, lint, pruebas, build, gateway, K8s, catálogo
bash deploy/scripts/validar-k8s.sh              # esquema, buenas prácticas y políticas
bash deploy/scripts/validar-kyverno.sh          # políticas de admisión
bash deploy/scripts/verificar-supply-chain.sh   # Hadolint, Trivy y Syft
bash scripts/configurar-proteccion-rama.sh      # requiere gh autenticado con permisos de administración
```

Resultado esperado: todos los comandos terminan con código 0. En Windows, usa
`C:\Program Files\Git\bin\bash.exe` si `bash` apunta a un WSL sin distribución.
