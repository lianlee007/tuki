# Modelo de amenazas de Tuki

Documento de trabajo del módulo 3 (DevSecOps y seguridad de la cadena de
suministro). Cubre la SPA, el AI Gateway, la cadena de CI/CD y el despliegue en
Kubernetes. No cubre la IA local porque está fuera del alcance de este trabajo.

- **Fecha:** 2026-10-25
- **Versión:** 1.0
- **Alcance:** Tuki en Compose y Kubernetes, con Supabase (datos, Auth y Storage)
  y Groq como servicios gestionados.
- **Metodología:** STRIDE para el análisis por frontera de confianza, con
  criticidad basada en probabilidad × impacto. Se toma como referencia NIST SSDF
  y SLSA para la parte de cadena de suministro.
- **Revisión:** anual, ante un cambio de arquitectura, ante un incidente de
  seguridad o antes de un despliegue a un nuevo entorno.

---

## 1. Supuestos y exclusiones

Supuestos:

1. El clúster de producción aplica las NetworkPolicy, el Pod Security
   `restricted` y las políticas de admisión del entorno.
2. Supabase aplica RLS en todas las tablas expuestas y el frontend solo usa la
   clave `anon`. La clave `service_role` nunca sale del backend de Supabase.
3. Supabase Storage aplica políticas RLS por bucket: lectura pública, escritura
   solo para usuarios autenticados y borrado reservado al propietario.
4. Groq es un proveedor externo de confianza para el texto enviado, con sus
   propias políticas de retención.
5. El repositorio y el registro de imágenes tienen controles de acceso y
   revisión por pares (branch protection, revisión de PR).
6. TLS termina en el Ingress de producción y en el proveedor de Supabase.

Exclusiones:

- IA local, modelos en el clúster y GPU (módulos 5 y 6).
- Seguridad física, red del proveedor cloud y compromiso total de Supabase,
  Supabase Storage o Groq.
- Fraude de negocio, contenido ilegal subido por usuarios y moderación editorial.
- Auditoría legal de licencias y cumplimiento normativo específico.

---

## 2. Activos

| Activo | Confidencialidad | Integridad | Disponibilidad | Dónde vive |
| --- | --- | --- | --- | --- |
| `GROQ_API_KEY` | Crítica | Alta | Alta | Secreto de Kubernetes; nunca en el bundle |
| Tokens de sesión de Supabase | Alta | Alta | Media | Navegador del usuario |
| Clave `anon` de Supabase | Pública por diseño | Alta | Alta | Bundle de la SPA |
| Datos de restaurantes, menús y platillos | Media | Alta | Alta | Supabase |
| Datos de cuentas (correo, identificadores) | Alta | Alta | Media | Supabase Auth |
| Imágenes de platillos | Baja/Media | Media | Media | Supabase Storage |
| Políticas RLS de Storage | Públicas (lectura) | Alta | Media | Supabase |
| Imágenes de contenedor | Alta | Crítica | Alta | GHCR |
| Manifiestos y configuración | Alta | Crítica | Alta | Git |
| Credenciales de CI/CD | Crítica | Crítica | Alta | GitHub Actions (OIDC y secretos) |
| Métricas y logs | Baja/Media | Media | Media | Prometheus, Grafana, logs del clúster |

Activos de negocio indirectos: reputación de los restaurantes, disponibilidad
del menú público y coste de la API de Groq.

---

## 3. Actores y capacidades

| Actor | Capacidad | Motivación |
| --- | --- | --- |
| Visitante anónimo | Lee menús públicos, usa la IA con cuota anónima | Uso legítimo o abuso de cuota |
| Usuario autenticado | Gestiona su restaurante y sus platillos | Uso legítimo o acceso a datos de otro tenant |
| Bot o atacante automatizado | Envía volumen alto, prueba payloads, busca claves | Coste, defacement, extracción |
| Atacante de cadena de suministro | Dependencia, imagen base, acción de CI o registro | Ejecución en producción |
| Insiders con acceso al repo o al clúster | Cambian código, manifiestos o secretos | Error o abuso |
| Proveedor comprometido | Supabase, Supabase Storage, Groq o GHCR | Fuera de control directo |
| Operador de plataforma | Lee métricas, aplica cambios, rota secretos | Operación legítima |

---

## 4. Arquitectura y fronteras de confianza

```
┌──────────────────────────────────────────────────────────────────────────┐
│ INTERNET                                                                 │
│  Navegador (SPA React)                                                   │
│    │  HTTPS                          HTTPS / WSS                        │
│    ├──────────────────────────────► Supabase Auth / Postgres (RLS)      │
│    ├──────────────────────────────► Supabase Storage (buckets)          │
│    │                                                                     │
│    ▼  HTTPS                                                              │
│  ┌────────────────────────┐   Frontera 1: Ingress / TLS                 │
│  │ ingress-nginx + TLS    │                                              │
│  └───────────┬────────────┘                                              │
│              │ /api                                                      │
│  ┌───────────▼────────────┐   Frontera 2: red del clúster               │
│  │ Nginx (web) :8080      │──── /api/ ───► AI Gateway :8000              │
│  │ rootfs read-only       │               FastAPI, no root              │
│  └────────────────────────┘                    │                        │
│                                                │ HTTPS 443              │
│  ┌─────────────────────────────────────────────▼──────────────────────┐ │
│  │ Groq Cloud (API externa)                                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────────────┐    Frontera 3: CI/CD y cadena de suministro   │
│  │ GitHub Actions       │──► GHCR ──► clúster (pull)                   │
│  │ OIDC, Trivy, Syft    │──► Cosign keyless                          │
│  └──────────┬───────────┘                                              │
│             │ ArgoCD                                                    │
│  ┌──────────▼───────────┐                                               │
│  │ Kubernetes API       │                                               │
│  └──────────────────────┘                                               │
└──────────────────────────────────────────────────────────────────────────┘
```

Fronteras:

1. **Internet ↔ Ingress/Nginx.** Todo lo que llega del navegador es no confiable.
2. **Nginx ↔ AI Gateway.** Red interna, pero el gateway también acepta tráfico
   del Ingress y de monitorización según la NetworkPolicy.
3. **Gateway ↔ Groq / Supabase JWKS.** Salida a Internet por 443.
4. **CI/CD ↔ GHCR ↔ clúster.** Artefactos y credenciales de automatización.
5. **Operadores ↔ clúster.** `kubectl`, ArgoCD y el proveedor de secretos.

---

## 5. Flujos de datos

| Flujo | Datos | Control principal |
| --- | --- | --- |
| Navegador → Nginx | HTML, JS, CSS, peticiones `/api` | TLS en Ingress, CSP y cabeceras de seguridad |
| Navegador → Supabase | Credenciales, JWT, datos de menús | TLS, RLS, clave `anon` pública |
| Navegador → Supabase Storage | Imágenes comprimidas a WebP | TLS, políticas RLS por bucket, límite de tamaño y cuota |
| Navegador → Gateway | `prompt`, `system`, token opcional | Validación Pydantic, límite de cuerpo 64k, cuota |
| Gateway → Supabase JWKS | `kid` y validación de firma | HTTPS, caché de claves |
| Gateway → Groq | Prompt y parámetros del modelo | HTTPS, clave en servidor, timeout y reintentos |
| CI → GHCR | Imágenes, SBOM, firmas | OIDC de corta duración, Cosign keyless |
| ArgoCD → Kubernetes | Manifiestos renderizados | Git como fuente de verdad, RBAC de ArgoCD |
| Prometheus → pods | Métricas | NetworkPolicy, endpoints internos |

Datos que **no** deberían viajar a Groq: correos, teléfonos, direcciones,
identificadores de usuario, tokens, secretos o contenido de bases de datos. El
gateway no los añade por diseño; la responsabilidad de no incluirlos en el
`prompt` es del cliente.

---

## 6. Análisis STRIDE

### 6.1 Spoofing (suplantación)

| ID | Amenaza | Impacto | Controles | Riesgo residual |
| --- | --- | --- | --- | --- |
| S1 | JWT forjado o expirado para consumir cuota autenticada | Alto | Firma JWKS o, en proyectos HS256, comprobación del token en GoTrue con la `anon key`; `aud=authenticated`, `iss`, `exp`/`iat`; token inválido → 401; Supabase caído → 503 | Bajo |
| S2 | `X-Forwarded-For` falsificado para saltarse el rate limit por IP | Medio | Nginx sobrescribe `X-Real-IP`; el gateway prioriza esa cabecera; en producción el tráfico entra por Ingress | Bajo |
| S3 | Suplantación de GitHub Actions para publicar una imagen | Crítico | OIDC keyless, identidad verificada por Cosign, permisos mínimos del workflow | Medio (depende de la configuración del repo) |
| S4 | Suplantación de un restaurante para editar su menú | Alto | Supabase Auth + RLS por `usuario_id` | Bajo, si RLS está completo |

### 6.2 Tampering (manipulación)

| ID | Amenaza | Impacto | Controles | Riesgo residual |
| --- | --- | --- | --- | --- |
| T1 | Imagen alterada en el registro | Crítico | Digest, Trivy, SBOM, procedencia, Cosign; verificación en despliegue | Medio (no hay verificación en admisión) |
| T2 | Cambio malicioso en manifiestos o código | Alto | Revisión de PR, GitOps, ArgoCD `selfHeal`, historial de Git | Medio (sin branch protection verificada) |
| T3 | Cuerpo de petición malformado o gigante | Medio | Pydantic, límite de 64k en Nginx/Ingress, límite de prompt | Bajo |
| T4 | Dependencia comprometida | Alto | Lockfiles con hashes, SCA, actualizaciones planificadas | Medio (dependencias altas abiertas) |
| T5 | Prompt injection que altera el texto generado | Bajo/Medio | El modelo no tiene herramientas, no accede a datos y la salida se muestra como texto | Bajo; reevaluar si se añaden tools |

### 6.3 Repudiation (repudio)

| ID | Amenaza | Impacto | Controles | Riesgo residual |
| --- | --- | --- | --- | --- |
| R1 | No poder atribuir una petición de IA | Medio | `X-Request-Id`, logs JSON con ruta, estado, duración y tipo de identidad | Medio: no se registra el sujeto ni el prompt |
| R2 | Cambio manual en el clúster sin trazabilidad | Alto | GitOps, ArgoCD, `kubectl rollout history`, auditoría del proveedor | Bajo/Medio |
| R3 | Rotación de secreto sin registro | Medio | Runbook con procedimiento y verificación | Bajo |

### 6.4 Information disclosure (divulgación)

| ID | Amenaza | Impacto | Controles | Riesgo residual |
| --- | --- | --- | --- | --- |
| I1 | Clave de Groq en el bundle del navegador | Crítico | Gateway server-side, `VITE_GROQ_API_KEY` eliminada, verificación en CI de `gsk_` | Bajo |
| I2 | Acceso a datos de otro restaurante (IDOR) | Alto | RLS en Supabase, filtros por `usuario_id`, clave `anon` | Medio: requiere auditar todas las políticas |
| I3 | Secretos en logs o trazas | Alto | El gateway no registra tokens ni prompts; errores uniformes | Bajo |
| I4 | `/metrics`, `/docs` o `stub_status` expuestos | Medio | `/docs` desactivado en producción; métricas solo en red interna; `stub_status` en loopback | Bajo |
| I5 | Datos personales o de negocio enviados a Groq | Medio | Política de minimización; el gateway no añade PII | Medio: depende del prompt del cliente |
| I6 | Stack traces o configuración en errores | Medio | Manejo uniforme de errores; `AI_ENVIRONMENT=production` | Bajo |
| I7 | Fuga de la clave `service_role` de Supabase | Crítico | No se usa en el frontend; solo la clave `anon` | Bajo, si no se introduce por error |

### 6.5 Denial of service (denegación)

| ID | Amenaza | Impacto | Controles | Riesgo residual |
| --- | --- | --- | --- | --- |
| D1 | Abuso de la IA para agotar la cuota de Groq | Alto | Rate limit anónimo/autenticado, límite de tokens, timeout total, HPA | Medio: cuota por réplica y sin WAF |
| D2 | Ataque volumétrico a la SPA o al Ingress | Alto | Límites de Ingress, HPA, proveedor/CDN | Medio: no hay protección DDoS propia |
| D3 | Prompt o cuerpo enorme para agotar CPU/memoria | Medio | `client_max_body_size 64k`, límite de prompt, límites de recursos | Bajo |
| D4 | Caída o lentitud de Groq | Medio | Reintentos, fallback de modelos, timeout y errores 502/504 | Medio |
| D5 | DoS por validación de colecciones grandes (Zod) | Medio | Dependencia pendiente de actualizar; entradas acotadas | Medio |
| D6 | Fuga de memoria o crash del gateway | Medio | Límites, probes, reinicio por Kubernetes | Bajo |

### 6.6 Elevation of privilege (elevación)

| ID | Amenaza | Impacto | Controles | Riesgo residual |
| --- | --- | --- | --- | --- |
| E1 | Escape del contenedor | Crítico | No root, `cap_drop: ALL`, seccomp, rootfs read-only, sin `allowPrivilegeEscalation` | Bajo |
| E2 | Compromiso de CI para publicar o firmar una imagen maliciosa | Crítico | OIDC, permisos mínimos, secretos solo en push/tag, revisión de PR | Medio |
| E3 | ArgoCD con permisos excesivos | Alto | RBAC de ArgoCD fuera del repo; `selfHeal` y `prune` acotados a la app | Medio |
| E4 | Robo del token de la ServiceAccount | Medio | `automountServiceAccountToken: false`; la app no llama a la API | Bajo |
| E5 | Contenedor con escritura en el rootfs | Medio | `readOnlyRootFilesystem: true` y `/tmp` efímero | Bajo |

---

## 7. Escenarios priorizados

| # | Escenario | Prob. | Impacto | Riesgo | Tratamiento |
| --- | --- | --- | --- | --- | --- |
| 1 | Clave de Groq extraída del frontend y usada para generar coste | Media | Crítico | **Alto** | Resuelto: gateway y eliminación del bundle |
| 2 | Imagen de producción manipulada | Baja | Crítico | **Alto** | Digest, Cosign, Trivy y procedencia; falta verificación en admisión |
| 3 | Abuso de la IA anónima para agotar cuota | Alta | Medio | **Alto** | Cuota por IP, límite de tokens, timeout; falta WAF/Redis |
| 4 | IDOR entre restaurantes por una política RLS incompleta | Media | Alto | **Alto** | RLS y revisión de políticas; auditoría pendiente |
| 5 | Dependencia del frontend vulnerable | Alta | Medio | **Medio** | `pnpm audit`; actualización pendiente de React Router/Zod |
| 6 | Compromiso de una acción de GitHub por tag mutable | Baja | Crítico | **Medio** | Fijar SHA; Dependabot/Renovate |
| 7 | Abuso de la subida a Storage | Media | Medio | **Medio** | RLS por bucket, compresión en el navegador, límite de tamaño y cuota |
| 8 | Prompt con datos personales enviado a Groq | Media | Medio | **Medio** | Minimización y política de uso; no hay filtro automático |
| 9 | Caída de Groq | Media | Medio | **Medio** | Fallback y timeout; la SPA sigue disponible |
| 10 | Contenedor comprometido | Baja | Crítico | **Medio** | Hardening y NetworkPolicy; falta runtime detection |

---

## 8. Controles existentes y su evidencia

| Control | Implementación | Evidencia |
| --- | --- | --- |
| Autenticación de usuarios | Supabase Auth + JWT | `services/ai-gateway/app/auth.py` |
| Autorización multi-tenant | RLS de Supabase | `db/sql-descubrir.sql` y políticas del proyecto |
| Secreto de IA en servidor | Gateway con `GROQ_API_KEY` en runtime | `services/ai-gateway/app/config.py`, `ai-gateway-secret.example.yaml` |
| Cuotas | Token bucket por identidad | `services/ai-gateway/app/rate_limit.py` |
| Validación de entrada | Pydantic + límites | `services/ai-gateway/app/schemas.py`, Nginx |
| Cabeceras de seguridad | CSP, `nosniff`, `SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy` | `docker/nginx/snippets/security-headers.conf` |
| Hardening de contenedor | No root, read-only, caps, seccomp | Dockerfiles, Compose, Deployments |
| Aislamiento de red | NetworkPolicy de ingress/egress | `deploy/k8s/base/networkpolicy.yaml` |
| Límites de recursos | requests/limits y HPA | Deployments, HPA |
| Disponibilidad | 2 réplicas, PDB, anti-affinity, probes | Deployments, PDB |
| Escaneo de imágenes | Trivy | CI, script de supply chain |
| SBOM y procedencia | Syft y Buildx | CI |
| Firma | Cosign keyless | CI |
| Políticas pre-despliegue | conftest/Rego | `deploy/policies/kubernetes.rego` |
| Trazabilidad de peticiones | `X-Request-Id` y logs JSON | `services/ai-gateway/app/main.py` |
| Rotación de secretos | Procedimiento documentado | `docs/runbook.md` |
| Respuesta a incidentes | Runbook y alertas | `docs/runbook.md`, `deploy/observability/prometheusrule.yaml` |

---

## 9. Riesgos residuales aceptados

1. **Rate limit por réplica.** Con dos pods, la cuota efectiva se duplica. Se
   acepta para esta fase; la evolución es un limitador compartido (Redis). Ver
   `docs/adr/0004-rate-limit-en-memoria.md`.
2. **`apk upgrade` en la imagen web.** Aplica parches posteriores al digest y
   hace que dos builds del mismo commit puedan diferir. Se acepta porque la
   alternativa es desplegar vulnerabilidades conocidas; el SBOM registra lo que
   realmente se desplegó. Ver `docs/adr/0002-cadena-de-suministro.md`.
3. **Sin admission controller.** Las políticas se validan en CI, no en el
   clúster. Un `kubectl apply` manual podría saltarse conftest. Se acepta hasta
   evaluar Kyverno/Gatekeeper.
4. **Sin WAF ni DDoS de aplicación.** Se confía en el Ingress y, si existe, en
   un CDN delante. No hay reglas de reputación ni bloqueo por ASN.
5. **CSP permisiva por Tailwind CDN.** `unsafe-inline` y `unsafe-eval` reducen la
   protección frente a XSS. Se acepta mientras la UI use el CDN; la evolución es
   compilar Tailwind en el build.
6. **Acciones de GitHub por tag.** Un tag puede moverse. Se acepta por
   simplicidad; el endurecimiento es fijar SHA.
7. **Sin verificación de firma en admisión.** Cosign firma en CI, pero el
   clúster no rechaza una imagen sin firma. Se acepta hasta tener un admission
   controller con policy-controller o Kyverno.
8. **Sin clúster de producción en este entorno.** Las pruebas de runtime se
   hicieron en Docker Desktop. Ingress, HPA, NetworkPolicy y TLS se validaron por
   esquema, no en un entorno real.
9. **Datos enviados a Groq.** El proveedor es externo. Se mitiga no enviando PII,
   pero no hay un filtro automático que lo garantice.
10. **Subida sin backend intermedio.** Cualquier usuario autenticado puede subir a
    los buckets. El abuso se controla con políticas RLS, compresión y límite de
    tamaño en el navegador, y la cuota del plan de Supabase.

---

## 10. Plan de tratamiento

| Prioridad | Acción | Responsable | Criterio de cierre |
| --- | --- | --- | --- |
| P1 | Actualizar `react-router-dom`, `zod` y `ws` a versiones parcheadas | Frontend | `pnpm audit --prod --audit-level high` sin hallazgos |
| P1 | Auditar RLS de todas las tablas y probar acceso cruzado entre dos usuarios | Backend/Supabase | Prueba negativa documentada |
| P2 | Fijar las GitHub Actions por SHA y activar Dependabot | Plataforma | Workflow con SHA y PR automáticos |
| P2 | Añadir ESLint y `tsc --noEmit` al CI | Frontend | Pipeline en verde |
| P2 | Evaluar Kyverno/Gatekeeper y verificación de firma en admisión | Plataforma | Imagen sin firma rechazada en un clúster de prueba |
| P2 | Vigilar la cuota de Storage y ajustar los límites de subida | Producto | Cuota monitorizada y límite probado |
| P3 | Compilar Tailwind y retirar `unsafe-inline`/`unsafe-eval` | Frontend | CSP sin esas directivas y build en verde |
| P3 | Rate limit compartido con Redis | Plataforma | Cuota global verificada con dos réplicas |
| P3 | Política de retención de logs y SBOM | Plataforma | Retención definida y aplicada |

---

## 11. Disparadores de revisión

- Cambio en el proveedor de IA, en el modelo de autenticación o en el esquema de
  base de datos.
- Nuevo servicio, nueva ruta pública o nuevo flujo que envíe datos a terceros.
- Incidente de seguridad, fuga de secreto o alerta de vulnerabilidad crítica.
- Cambio de clúster, de CNI o de registro de imágenes.
- Adopción de herramientas de IA con capacidad de ejecutar acciones (tools,
  function calling, agentes), que cambiaría el riesgo de prompt injection.

---

## 12. Referencias

- `docs/modulos-1-3.md` — matriz de cumplimiento.
- `docs/security/hallazgos.md` — hallazgos y tratamiento.
- `docs/adr/0001-ai-gateway.md` — decisiones del gateway.
- `docs/adr/0002-cadena-de-suministro.md` — cadena de suministro.
- `docs/adr/0003-servicios-gestionados.md` — servicios gestionados.
- `docs/adr/0004-rate-limit-en-memoria.md` — limitación del rate limit.
- `docs/runbook.md` — respuesta a incidentes.
