# Bitácora de hallazgos de seguridad de Riki

Registro de hallazgos del módulo 3 (DevSecOps y cadena de suministro). Cada
hallazgo separa **criticidad técnica**, **explotabilidad en este contexto** y
**decisión de tratamiento**, para no confundir una vulnerabilidad conocida con
un riesgo real del despliegue.

- **Fecha de la revisión:** 2026-10-25
- **Alcance:** SPA, AI Gateway, imágenes, CI/CD y manifiestos de Kubernetes.
- **Fuera de alcance:** IA local (módulos 5 y 6), seguridad física y auditoría
  legal de licencias.
- **Responsable:** equipo de plataforma de Riki.

## Criterios de severidad

| Nivel | Criterio |
| --- | --- |
| **Crítico** | Exposición de un secreto de producción, ejecución remota, pérdida de aislamiento entre tenants o compromiso total del clúster |
| **Alto** | Divulgación de datos, elevación de privilegios, cadena de suministro sin verificación o abuso con coste relevante |
| **Medio** | Denegación de servicio, configuración débil, ausencia de defensa en profundidad o dependencia vulnerable de explotabilidad limitada |
| **Bajo** | Higiene, reproducibilidad, operación o documentación |

Estados: **Resuelto**, **Mitigado**, **Aceptado**, **Abierto**, **En seguimiento**.

---

## 1. Resumen

| ID | Hallazgo | Severidad | Estado |
| --- | --- | --- | --- |
| H-001 | Clave de Groq incrustada en el bundle del navegador | Crítica | Resuelto |
| H-002 | Endpoint de IA sin autenticación ni cuota | Alta | Resuelto |
| H-003 | Contenedores como root y rootfs escribible | Alta | Resuelto |
| H-004 | Sin SBOM, procedencia ni firma de imágenes | Alta | Resuelto en CI |
| H-005 | Dependencias del frontend con vulnerabilidades altas | Alta | Abierto |
| H-006 | Rate limit en memoria por réplica | Media | Aceptado |
| H-007 | Sin admission controller ni verificación de firma en admisión | Media | Abierto |
| H-008 | GitHub Actions fijadas por tag, no por SHA | Media | Abierto |
| H-009 | CSP con `unsafe-inline`/`unsafe-eval` por Tailwind CDN | Media | Aceptado |
| H-010 | CSP permitía un origen de Gemini ya no usado | Baja | Resuelto |
| H-011 | Autenticación deshabilitada en el overlay local | Media | Aceptado con control |
| H-012 | Sin clúster ni registro de producción; imágenes locales sin firma | Media | Aceptado |
| H-013 | NetworkPolicy no aplicada en Docker Desktop/kind por defecto | Media | Aceptado en local |
| H-014 | Caché de imágenes por tag en Docker Desktop | Baja | Resuelto operativamente |
| H-015 | `apk upgrade` hace que el build no sea bit a bit reproducible | Baja | Aceptado |
| H-016 | Sin ESLint ni `tsc --noEmit` en CI | Media | Abierto |
| H-017 | Preset de Cloudinary sin firma expuesto al navegador | Media | Abierto |
| H-018 | Posible envío de datos personales o de negocio a Groq | Media | Aceptado con política |
| H-019 | Sin revisión automatizada de licencias | Baja | Abierto |
| H-020 | Sin retención definida de SBOM, logs y evidencias | Baja | Abierto |
| H-021 | Sin WAF ni protección DDoS de aplicación | Media | Aceptado |
| H-022 | Sin detección de runtime (Falco u equivalente) | Media | Abierto |

---

## 2. Hallazgos detallados

### H-001 · Clave de Groq incrustada en el bundle del navegador

- **Severidad:** Crítica
- **Estado:** Resuelto
- **Activo afectado:** `GROQ_API_KEY`
- **Descripción:** la versión anterior llamaba a Groq desde el navegador con
  `VITE_GROQ_API_KEY`. Cualquier `VITE_*` termina en el bundle, así que la clave
  era extraíble por cualquier visitante y podía generar coste o agotar la cuota.
- **Evidencia:** el bundle antiguo contenía `gsk_...` y `api.groq.com`.
- **Tratamiento:** se creó el AI Gateway; la clave vive solo en el runtime del
  servidor. Se eliminó `VITE_GROQ_API_KEY`, se borró la dependencia
  `@google/genai` y la SPA llama a `/api/v1/ai/chat` en el mismo origen.
- **Verificación:**

  ```bash
  pnpm build
  grep -RInE 'gsk_[A-Za-z0-9]{20,}|VITE_GROQ_API_KEY|api\.groq\.com' dist
  ```

  El comando no debe devolver nada. El CI ejecuta la misma comprobación.
- **Riesgo residual:** bajo. La clave puede filtrarse por otras vías (logs,
  volcados, repositorio), pero no por el bundle.

### H-002 · Endpoint de IA sin autenticación ni cuota

- **Severidad:** Alta
- **Estado:** Resuelto
- **Activo afectado:** disponibilidad y coste de Groq
- **Descripción:** un endpoint público sin cuota permite que un bot consuma la
  cuota y genere coste. En el modo anterior no había identidad ni límite.
- **Tratamiento:** validación JWT con JWKS de Supabase, modo anónimo con cuota
  por IP, token bucket, límite de prompt, timeout por intento y timeout total,
  fallback de modelos y cabeceras `X-RateLimit-*`.
- **Verificación:** pruebas del gateway para 401, 429, timeout y fallback;
  `pytest` con 39 pruebas aprobadas.
- **Riesgo residual:** medio. La cuota es por réplica y no hay WAF. Ver H-006 y
  H-021.

### H-003 · Contenedores como root y rootfs escribible

- **Severidad:** Alta
- **Estado:** Resuelto
- **Activo afectado:** pods web y gateway
- **Descripción:** un proceso root dentro del contenedor amplía el impacto de
  una vulnerabilidad de la aplicación o de Nginx.
- **Tratamiento:** usuario `101` (web) y `10001` (gateway), `readOnlyRootFilesystem`,
  `allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`, seccomp
  `RuntimeDefault`, `/tmp` efímero y `automountServiceAccountToken: false`.
- **Verificación:** Pod Security `restricted`, conftest 189/189, pods en runtime
  como UID 101 y 10001.
- **Riesgo residual:** bajo. No se usa una imagen distroless; Nginx conserva
  utilidades del sistema.

### H-004 · Sin SBOM, procedencia ni firma de imágenes

- **Severidad:** Alta
- **Estado:** Resuelto en CI
- **Activo afectado:** cadena de suministro
- **Descripción:** sin SBOM ni firma no se puede demostrar qué se construyó ni
  verificar que la imagen desplegada proviene del pipeline.
- **Tratamiento:** Syft genera SBOM SPDX; Buildx publica procedencia y SBOM;
  Cosign firma keyless con OIDC de GitHub Actions y se verifica la firma en el
  mismo workflow.
- **Verificación:** jobs `imagen-web` e `imagen-gateway` en
  `.github/workflows/contenedor.yml`; comandos de `cosign verify` en
  `deploy/README.md` §10.4.
- **Riesgo residual:** medio. La firma no se exige en admisión (H-007) y no hay
  registro remoto en este entorno para probarla de extremo a extremo.

### H-005 · Dependencias del frontend con vulnerabilidades altas

- **Severidad:** Alta (técnica) / Media (contextual)
- **Estado:** Abierto
- **Activos afectados:** SPA, reputación, disponibilidad del navegador
- **Descripción:** `pnpm audit --prod` reporta **9 altas, 7 moderadas y 0
  críticas**. Los paquetes afectados son:

  | Paquete | Versión actual | Versión parcheada | Avisos principales |
  | --- | --- | --- | --- |
  | `react-router` | 7.9.6 | ≥ 7.18.0 | Open redirect, XSS, DoS, inyección de constructores en SSR |
  | `zod` | 4.1.12 | ≥ 4.6.6 | Agotamiento de memoria con colecciones grandes |
  | `ws` (transitiva) | 8.18.3 | ≥ 8.21.0 | Divulgación de memoria y DoS por fragmentos |

- **Explotabilidad contextual:** Riki es una SPA sin SSR. Los avisos de RCE y
  XSS de SSR de React Router no aplican directamente, pero los de open redirect,
  XSS en `ScrollRestoration` y denegación de servicio sí pueden afectar al
  navegador. `zod` se usa para validar formularios; una entrada acotada reduce el
  impacto. `ws` llega por el cliente de Supabase Realtime.
- **Tratamiento propuesto:** actualizar en una rama dedicada, ejecutar
  `pnpm build`, revisar rutas y formularios, y volver a ejecutar `pnpm audit`.
  No se hizo en esta iteración para no mezclar una actualización funcional con
  los entregables de documentación.
- **Criterio de cierre:**

  ```bash
  pnpm update react-router-dom zod
  pnpm build
  pnpm audit --prod --audit-level high
  ```

  Sin hallazgos altos. Si `ws` no se actualiza por transitividad, añadir un
  `pnpm.overrides` acotado y verificar Supabase Realtime.
- **Riesgo residual:** medio mientras no se actualice. El CI bloquea solo
  críticas y muestra las altas como advertencia.

### H-006 · Rate limit en memoria por réplica

- **Severidad:** Media
- **Estado:** Aceptado
- **Descripción:** cada pod tiene su propio token bucket. Con dos réplicas, la
  cuota efectiva se duplica y un atacante puede distribuir peticiones entre pods.
- **Tratamiento:** se acepta para esta fase. La cuota sigue limitando el abuso
  por IP y el coste total está acotado por los timeouts y el límite de tokens.
- **Evolución:** Redis o un limitador compartido. Ver
  `docs/adr/0004-rate-limit-en-memoria.md`.
- **Riesgo residual:** medio, aceptado conscientemente.

### H-007 · Sin admission controller ni verificación de firma en admisión

- **Severidad:** Media
- **Estado:** Abierto
- **Descripción:** conftest valida los manifiestos en CI, pero un
  `kubectl apply` manual podría desplegar una imagen sin firma o un pod que no
  cumpla las políticas. El clúster no rechaza el artefacto.
- **Tratamiento propuesto:** evaluar Kyverno o Gatekeeper con políticas de
  imagen firmada, rootfs read-only, no root y límites. Reutilizar la lógica de
  `deploy/policies/kubernetes.rego`.
- **Criterio de cierre:** una imagen sin firma y un pod privilegiado son
  rechazados en un clúster de prueba.
- **Riesgo residual:** medio.

### H-008 · GitHub Actions fijadas por tag, no por SHA

- **Severidad:** Media
- **Estado:** Abierto
- **Descripción:** acciones como `actions/checkout@v4` o
  `aquasecurity/trivy-action@0.28.0` usan tags mutables. Un compromiso del tag
  podría ejecutar código en el pipeline con permisos de `packages: write` e
  `id-token: write`.
- **Tratamiento propuesto:** fijar cada acción a un SHA completo, activar
  Dependabot o Renovate para actualizarlas y revisar los cambios de SHA.
- **Riesgo residual:** medio. El workflow usa permisos acotados y no expone
  secretos en PR, lo que reduce el impacto.

### H-009 · CSP con `unsafe-inline`/`unsafe-eval` por Tailwind CDN

- **Severidad:** Media
- **Estado:** Aceptado
- **Descripción:** la CSP permite scripts inline y `eval` porque la UI carga
  Tailwind Play CDN y scripts inline. Esto debilita la defensa contra XSS.
- **Tratamiento:** se acepta mientras se use el CDN. La evolución es compilar
  Tailwind en el build, retirar `unsafe-inline`/`unsafe-eval` y usar nonces o
  hashes.
- **Riesgo residual:** medio. Se compensa con React (escape por defecto),
  `object-src 'none'`, `base-uri 'self'` y `frame-ancestors 'self'`.

### H-010 · CSP permitía un origen de Gemini ya no usado

- **Severidad:** Baja
- **Estado:** Resuelto
- **Descripción:** la CSP incluía `https://generativelanguage.googleapis.com`
  después de eliminar la integración con Gemini. Era un permiso innecesario.
- **Tratamiento:** se retiró el origen y se actualizó el comentario de
  `docker/nginx/snippets/security-headers.conf`.
- **Verificación:** `grep -R "generativelanguage"` sin resultados en el código y
  en la configuración; `nginx -t` en la imagen.

### H-011 · Autenticación deshabilitada en el overlay local

- **Severidad:** Media (si se expone) / Baja (en local)
- **Estado:** Aceptado con control
- **Descripción:** `AI_AUTH_MODE=disabled` permite probar sin Supabase. Si ese
  modo se aplicara a producción, cualquiera podría consumir la IA como anónimo.
- **Tratamiento:** el overlay local es el único que lo activa; la configuración
  falla al arrancar si `AI_ENVIRONMENT=production` y `AI_AUTH_MODE=disabled`. La
  documentación advierte que no debe exponerse a Internet.
- **Riesgo residual:** bajo, con el fail-fast como red de seguridad.

### H-012 · Sin clúster ni registro de producción; imágenes locales sin firma

- **Severidad:** Media
- **Estado:** Aceptado
- **Descripción:** el entorno solo tiene Docker Desktop. Las imágenes
  `riki:local-0.2.0` y `riki-ai-gateway:local-0.2.0` no están firmadas ni
  publicadas; Cosign y GHCR solo se ejecutan en GitHub Actions.
- **Tratamiento:** se documenta como limitación. Antes de producción hay que
  publicar, firmar, verificar y desplegar por digest.
- **Riesgo residual:** medio, aceptado por el alcance del trabajo.

### H-013 · NetworkPolicy no aplicada en Docker Desktop/kind por defecto

- **Severidad:** Media
- **Estado:** Aceptado en local
- **Descripción:** el overlay local elimina las NetworkPolicy porque Docker
  Desktop y el CNI por defecto de kind no las aplican de forma fiable. En
  producción sí se incluyen, pero dependen del CNI.
- **Tratamiento:** el overlay de producción las conserva; el README advierte de
  la dependencia del CNI y de las sondas del kubelet.
- **Riesgo residual:** medio en local; bajo en producción con un CNI compatible.

### H-014 · Caché de imágenes por tag en Docker Desktop

- **Severidad:** Baja
- **Estado:** Resuelto operativamente
- **Descripción:** Docker Desktop puede reutilizar una imagen con el mismo tag y
  desplegar configuración vieja.
- **Tratamiento:** tags únicos (`local-0.2.0`, `local-0.2.1`, …) y documentación
  en `deploy/README.md` §7.2. En producción se usa digest.
- **Riesgo residual:** bajo.

### H-015 · `apk upgrade` hace que el build no sea bit a bit reproducible

- **Severidad:** Baja
- **Estado:** Aceptado
- **Descripción:** la etapa runtime de la web ejecuta `apk upgrade --no-cache`
  para aplicar parches publicados después del digest de la base. Dos builds del
  mismo commit pueden diferir en parches del sistema operativo.
- **Tratamiento:** se acepta como excepción consciente; el SBOM y el digest de
  la imagen publicada registran lo que se desplegó. Ver ADR 0002.
- **Riesgo residual:** bajo.

### H-016 · Sin ESLint ni `tsc --noEmit` en CI

- **Severidad:** Media
- **Estado:** Abierto
- **Descripción:** el build de Vite usa esbuild y no hace comprobación de tipos.
  `pnpm exec tsc --noEmit` falla hoy con errores en componentes del panel,
  `Boton.tsx`, `ErrorBoundary.tsx` y páginas en curso. No hay ESLint.
- **Tratamiento propuesto:** corregir los errores de tipos en una rama aparte,
  añadir `tsc --noEmit` y ESLint al job `validar-web`. No se añadió ahora para
  no bloquear el trabajo de frontend en curso.
- **Riesgo residual:** medio: un error de tipos puede llegar a producción.

### H-017 · Preset de Cloudinary sin firma expuesto al navegador

- **Severidad:** Media
- **Estado:** Abierto (contextual)
- **Descripción:** el preset de subida es público por diseño. Un atacante puede
  subir imágenes y consumir cuota o almacenamiento si el preset no está
  restringido.
- **Tratamiento propuesto:** limitar formatos, tamaño, carpeta y transformaciones
  en Cloudinary; activar alertas de cuota; considerar subida firmada si el flujo
  lo permite.
- **Riesgo residual:** medio, fuera del repositorio.

### H-018 · Posible envío de datos personales o de negocio a Groq

- **Severidad:** Media
- **Estado:** Aceptado con política
- **Descripción:** el `prompt` lo construye el cliente. Si incluye correos,
  teléfonos o datos internos, se envían a un proveedor externo.
- **Tratamiento:** el gateway no añade PII; la política es no enviar datos
  personales y limitar el prompt a texto de menús o marketing. Se documenta en
  el modelo de amenazas.
- **Riesgo residual:** medio. No hay filtro automático de PII.

### H-019 · Sin revisión automatizada de licencias

- **Severidad:** Baja
- **Estado:** Abierto
- **Descripción:** el CI no revisa licencias de dependencias. Una dependencia
  con licencia incompatible podría pasar inadvertida.
- **Tratamiento propuesto:** añadir `pnpm licenses ls` o una herramienta de
  política de licencias al job de auditoría.
- **Riesgo residual:** bajo.

### H-020 · Sin retención definida de SBOM, logs y evidencias

- **Severidad:** Baja
- **Estado:** Abierto
- **Descripción:** los SBOM se generan como artefactos de GitHub Actions, pero no
  hay una política de retención ni un archivo de release a largo plazo.
- **Tratamiento propuesto:** adjuntar SBOM y firmas al release, definir retención
  y documentarla en el runbook.
- **Riesgo residual:** bajo.

### H-021 · Sin WAF ni protección DDoS de aplicación

- **Severidad:** Media
- **Estado:** Aceptado
- **Descripción:** no hay reglas de WAF, reputación de IP ni bloqueo por ASN. El
  rate limit del gateway no protege la SPA ni el Ingress de un ataque volumétrico.
- **Tratamiento:** se confía en el proveedor de Ingress y, si existe, en un CDN
  delante. La evolución es Cloudflare o reglas de ingress-nginx.
- **Riesgo residual:** medio.

### H-022 · Sin detección de runtime (Falco u equivalente)

- **Severidad:** Media
- **Estado:** Abierto
- **Descripción:** hay prevención (hardening, NetworkPolicy, seccomp), pero no
  detección de comportamientos anómalos dentro del contenedor.
- **Tratamiento propuesto:** evaluar Falco o Tetragon en un clúster de prueba y
  definir reglas para ejecución de shell, escritura en rutas sensibles y
  conexiones salientes inesperadas.
- **Riesgo residual:** medio.

---

## 3. Verificaciones limpias

Estas comprobaciones no son hallazgos, pero forman parte de la evidencia:

| Verificación | Resultado | Fecha |
| --- | --- | --- |
| Trivy `riki:local-0.2.0` | 0 `HIGH`/`CRITICAL` corregibles | 2026-10-25 |
| Trivy `riki-ai-gateway:local-0.2.0` | 0 `HIGH`/`CRITICAL` corregibles | 2026-10-25 |
| `pip-audit -r requirements.txt --require-hashes` | Sin vulnerabilidades conocidas | 2026-10-25 |
| `pnpm audit --prod` | 0 críticas; 9 altas y 7 moderadas (H-005) | 2026-10-25 |
| Bundle sin `gsk_`, `VITE_GROQ_API_KEY` ni `api.groq.com` | Correcto | 2026-10-25 |
| conftest | 189/189 | 2026-10-25 |
| kubeconform | 25 recursos, 22 válidos, 3 CRDs omitidos | 2026-10-25 |
| kube-linter | Sin errores | 2026-10-25 |
| Hadolint | Sin hallazgos | 2026-10-25 |
| Actionlint | Workflow válido | 2026-10-25 |
| Shellcheck | Scripts sin advertencias | 2026-10-25 |
| Runtime Compose y K8s local | Chat real HTTP 200; pods no root | 2026-10-25 |

---

## 4. Seguimiento

| Acción | Hallazgo | Prioridad | Estado |
| --- | --- | --- | --- |
| Actualizar React Router, Zod y `ws` | H-005 | P1 | Pendiente |
| Auditar RLS y probar acceso cruzado | Modelo de amenazas I2 | P1 | Pendiente |
| Fijar Actions por SHA | H-008 | P2 | Pendiente |
| Añadir ESLint y `tsc --noEmit` | H-016 | P2 | Pendiente |
| Evaluar admission controller | H-007 | P2 | Pendiente |
| Restringir preset de Cloudinary | H-017 | P2 | Pendiente |
| Compilar Tailwind y endurecer CSP | H-009 | P3 | Pendiente |
| Rate limit compartido | H-006 | P3 | Pendiente |
| Retención de SBOM y logs | H-020 | P3 | Pendiente |
| Revisión de licencias | H-019 | P3 | Pendiente |
| Evaluar Falco/Tetragon | H-022 | P3 | Pendiente |

---

## 5. Referencias

- `docs/security/modelo-de-amenazas.md`
- `docs/security/registro-uso-ia.md`
- `docs/modulos-1-3.md`
- `deploy/README.md` §10 — cadena de suministro.
- `docs/adr/0002-cadena-de-suministro.md`
- `docs/adr/0004-rate-limit-en-memoria.md`
- `.github/workflows/contenedor.yml`
