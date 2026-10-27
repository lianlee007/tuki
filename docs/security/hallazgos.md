# BitÃ¡cora de hallazgos de seguridad de Tuki

Registro de hallazgos del mÃ³dulo 3 (DevSecOps y cadena de suministro). Cada
hallazgo separa **criticidad tÃ©cnica**, **explotabilidad en este contexto** y
**decisiÃ³n de tratamiento**, para no confundir una vulnerabilidad conocida con
un riesgo real del despliegue.

- **Fecha de la revisiÃ³n:** 2026-10-25
- **Alcance:** SPA, AI Gateway, imÃ¡genes, CI/CD y manifiestos de Kubernetes.
- **Fuera de alcance:** IA local (mÃ³dulos 5 y 6), seguridad fÃ­sica y auditorÃ­a
  legal de licencias.
- **Responsable:** equipo de plataforma de Tuki.

## Criterios de severidad

| Nivel | Criterio |
| --- | --- |
| **CrÃ­tico** | ExposiciÃ³n de un secreto de producciÃ³n, ejecuciÃ³n remota, pÃ©rdida de aislamiento entre tenants o compromiso total del clÃºster |
| **Alto** | DivulgaciÃ³n de datos, elevaciÃ³n de privilegios, cadena de suministro sin verificaciÃ³n o abuso con coste relevante |
| **Medio** | DenegaciÃ³n de servicio, configuraciÃ³n dÃ©bil, ausencia de defensa en profundidad o dependencia vulnerable de explotabilidad limitada |
| **Bajo** | Higiene, reproducibilidad, operaciÃ³n o documentaciÃ³n |

Estados: **Resuelto**, **Mitigado**, **Aceptado**, **Abierto**, **En seguimiento**.

---

## 1. Resumen

| ID | Hallazgo | Severidad | Estado |
| --- | --- | --- | --- |
| H-001 | Clave de Groq incrustada en el bundle del navegador | CrÃ­tica | Resuelto |
| H-002 | Endpoint de IA sin autenticaciÃ³n ni cuota | Alta | Resuelto |
| H-003 | Contenedores como root y rootfs escribible | Alta | Resuelto |
| H-004 | Sin SBOM, procedencia ni firma de imÃ¡genes | Alta | Resuelto en CI |
| H-005 | Dependencias del frontend con vulnerabilidades altas | Alta | Cerrado |
| H-006 | Rate limit en memoria por rÃ©plica | Media | Aceptado |
| H-007 | Sin admission controller ni verificaciÃ³n de firma en admisiÃ³n | Media | Abierto |
| H-008 | GitHub Actions fijadas por tag, no por SHA | Media | Abierto |
| H-009 | CSP con `unsafe-inline`/`unsafe-eval` por Tailwind CDN | Media | Aceptado |
| H-010 | CSP permitÃ­a un origen de Gemini ya no usado | Baja | Resuelto |
| H-011 | AutenticaciÃ³n deshabilitada en el overlay local | Media | Aceptado con control |
| H-012 | Sin clÃºster ni registro de producciÃ³n; imÃ¡genes locales sin firma | Media | Aceptado |
| H-013 | NetworkPolicy no aplicada en Docker Desktop/kind por defecto | Media | Aceptado en local |
| H-014 | CachÃ© de imÃ¡genes por tag en Docker Desktop | Baja | Resuelto operativamente |
| H-015 | `apk upgrade` hace que el build no sea bit a bit reproducible | Baja | Aceptado |
| H-016 | Sin ESLint ni `tsc --noEmit` en CI | Media | Abierto |
| H-017 | Preset de Cloudinary sin firma expuesto al navegador | Media | Abierto |
| H-018 | Posible envÃ­o de datos personales o de negocio a Groq | Media | Aceptado con polÃ­tica |
| H-019 | Sin revisiÃ³n automatizada de licencias | Baja | Abierto |
| H-020 | Sin retenciÃ³n definida de SBOM, logs y evidencias | Baja | Abierto |
| H-021 | Sin WAF ni protecciÃ³n DDoS de aplicaciÃ³n | Media | Aceptado |
| H-022 | Sin detecciÃ³n de runtime (Falco u equivalente) | Media | Abierto |

---

## 2. Hallazgos detallados

### H-001 Â· Clave de Groq incrustada en el bundle del navegador

- **Severidad:** CrÃ­tica
- **Estado:** Resuelto
- **Activo afectado:** `GROQ_API_KEY`
- **DescripciÃ³n:** la versiÃ³n anterior llamaba a Groq desde el navegador con
  `VITE_GROQ_API_KEY`. Cualquier `VITE_*` termina en el bundle, asÃ­ que la clave
  era extraÃ­ble por cualquier visitante y podÃ­a generar coste o agotar la cuota.
- **Evidencia:** el bundle antiguo contenÃ­a `gsk_...` y `api.groq.com`.
- **Tratamiento:** se creÃ³ el AI Gateway; la clave vive solo en el runtime del
  servidor. Se eliminÃ³ `VITE_GROQ_API_KEY`, se borrÃ³ la dependencia
  `@google/genai` y la SPA llama a `/api/v1/ai/chat` en el mismo origen.
- **VerificaciÃ³n:**

  ```bash
  pnpm build
  grep -RInE 'gsk_[A-Za-z0-9]{20,}|VITE_GROQ_API_KEY|api\.groq\.com' dist
  ```

  El comando no debe devolver nada. El CI ejecuta la misma comprobaciÃ³n.
- **Riesgo residual:** bajo. La clave puede filtrarse por otras vÃ­as (logs,
  volcados, repositorio), pero no por el bundle.

### H-002 Â· Endpoint de IA sin autenticaciÃ³n ni cuota

- **Severidad:** Alta
- **Estado:** Resuelto
- **Activo afectado:** disponibilidad y coste de Groq
- **DescripciÃ³n:** un endpoint pÃºblico sin cuota permite que un bot consuma la
  cuota y genere coste. En el modo anterior no habÃ­a identidad ni lÃ­mite.
- **Tratamiento:** validaciÃ³n JWT con JWKS de Supabase, modo anÃ³nimo con cuota
  por IP, token bucket, lÃ­mite de prompt, timeout por intento y timeout total,
  fallback de modelos y cabeceras `X-RateLimit-*`.
- **VerificaciÃ³n:** pruebas del gateway para 401, 429, timeout y fallback;
  `pytest` con 39 pruebas aprobadas.
- **Riesgo residual:** medio. La cuota es por rÃ©plica y no hay WAF. Ver H-006 y
  H-021.

### H-003 Â· Contenedores como root y rootfs escribible

- **Severidad:** Alta
- **Estado:** Resuelto
- **Activo afectado:** pods web y gateway
- **DescripciÃ³n:** un proceso root dentro del contenedor amplÃ­a el impacto de
  una vulnerabilidad de la aplicaciÃ³n o de Nginx.
- **Tratamiento:** usuario `101` (web) y `10001` (gateway), `readOnlyRootFilesystem`,
  `allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`, seccomp
  `RuntimeDefault`, `/tmp` efÃ­mero y `automountServiceAccountToken: false`.
- **VerificaciÃ³n:** Pod Security `restricted`, conftest 369/369, pods en runtime
  como UID 101 y 10001.
- **Riesgo residual:** bajo. No se usa una imagen distroless; Nginx conserva
  utilidades del sistema.

### H-004 Â· Sin SBOM, procedencia ni firma de imÃ¡genes

- **Severidad:** Alta
- **Estado:** Resuelto en CI
- **Activo afectado:** cadena de suministro
- **DescripciÃ³n:** sin SBOM ni firma no se puede demostrar quÃ© se construyÃ³ ni
  verificar que la imagen desplegada proviene del pipeline.
- **Tratamiento:** Syft genera SBOM SPDX; Buildx publica procedencia y SBOM;
  Cosign firma keyless con OIDC de GitHub Actions y se verifica la firma en el
  mismo workflow.
- **VerificaciÃ³n:** jobs `imagen-web` e `imagen-gateway` en
  `.github/workflows/contenedor.yml`; comandos de `cosign verify` en
  `deploy/README.md` Â§10.4.
- **Riesgo residual:** medio. La firma no se exige en admisiÃ³n (H-007) y no hay
  registro remoto en este entorno para probarla de extremo a extremo.

### H-005 Â· Dependencias del frontend con vulnerabilidades altas

- **Severidad:** Alta (tÃ©cnica) / Media (contextual)
- **Estado:** Cerrado (2026-10-27)
- **Activos afectados:** SPA, reputaciÃ³n, disponibilidad del navegador
- **DescripciÃ³n:** `pnpm audit --prod` reportaba **9 altas, 7 moderadas y 0
  crÃ­ticas**. Los paquetes afectados eran:

  | Paquete | VersiÃ³n anterior | VersiÃ³n aplicada | Avisos principales |
  | --- | --- | --- | --- |
  | `react-router` | 7.9.6 | 7.18.4 | Open redirect, XSS, DoS, inyecciÃ³n de constructores en SSR |
  | `zod` | 4.1.12 | 4.6.7 | Agotamiento de memoria con colecciones grandes |
  | `ws` (transitiva) | 8.18.3 | 8.22.0 | DivulgaciÃ³n de memoria y DoS por fragmentos |

- **Explotabilidad contextual:** Tuki es una SPA sin SSR. Los avisos de RCE y
  XSS de SSR de React Router no aplican directamente, pero los de open redirect,
  XSS en `ScrollRestoration` y denegaciÃ³n de servicio sÃ­ pueden afectar al
  navegador. `zod` se usa para validar formularios; una entrada acotada reduce el
  impacto. `ws` llega por el cliente de Supabase Realtime.
- **Tratamiento aplicado:** actualizaciÃ³n de `react-router-dom` a 7.18.4 y `zod`
  a 4.6.7, y `pnpm.overrides` para fijar `ws` en 8.22.0 en todo el Ã¡rbol. Se
  verificÃ³ con `tsc --noEmit`, 36 pruebas de Vitest, build de producciÃ³n y
  `pnpm audit --prod --audit-level high`.
- **Criterio de cierre cumplido:**

  ```text
  pnpm audit --prod --audit-level high  ->  No known vulnerabilities found
  pnpm typecheck                        ->  sin errores
  pnpm test                             ->  36/36
  pnpm build                            ->  correcto
  ```

- **Riesgo residual:** bajo. El CI bloquea ahora tambiÃ©n las vulnerabilidades
  altas (`pnpm audit --prod --audit-level critical` sigue siendo el gate duro y
  el informativo de altas ya no reporta nada).

### H-006 Â· Rate limit en memoria por rÃ©plica

- **Severidad:** Media
- **Estado:** Aceptado
- **DescripciÃ³n:** cada pod tiene su propio token bucket. Con dos rÃ©plicas, la
  cuota efectiva se duplica y un atacante puede distribuir peticiones entre pods.
- **Tratamiento:** se acepta para esta fase. La cuota sigue limitando el abuso
  por IP y el coste total estÃ¡ acotado por los timeouts y el lÃ­mite de tokens.
- **EvoluciÃ³n:** Redis o un limitador compartido. Ver
  `docs/adr/0004-rate-limit-en-memoria.md`.
- **Riesgo residual:** medio, aceptado conscientemente.

### H-007 Â· Sin admission controller ni verificaciÃ³n de firma en admisiÃ³n

- **Severidad:** Media
- **Estado:** Abierto
- **DescripciÃ³n:** conftest valida los manifiestos en CI, pero un
  `kubectl apply` manual podrÃ­a desplegar una imagen sin firma o un pod que no
  cumpla las polÃ­ticas. El clÃºster no rechaza el artefacto.
- **Tratamiento propuesto:** evaluar Kyverno o Gatekeeper con polÃ­ticas de
  imagen firmada, rootfs read-only, no root y lÃ­mites. Reutilizar la lÃ³gica de
  `deploy/policies/kubernetes.rego`.
- **Criterio de cierre:** una imagen sin firma y un pod privilegiado son
  rechazados en un clÃºster de prueba.
- **Riesgo residual:** medio.

### H-008 Â· GitHub Actions fijadas por tag, no por SHA

- **Severidad:** Media
- **Estado:** Abierto
- **DescripciÃ³n:** acciones como `actions/checkout@v4` o
  `aquasecurity/trivy-action@0.28.0` usan tags mutables. Un compromiso del tag
  podrÃ­a ejecutar cÃ³digo en el pipeline con permisos de `packages: write` e
  `id-token: write`.
- **Tratamiento propuesto:** fijar cada acciÃ³n a un SHA completo, activar
  Dependabot o Renovate para actualizarlas y revisar los cambios de SHA.
- **Riesgo residual:** medio. El workflow usa permisos acotados y no expone
  secretos en PR, lo que reduce el impacto.

### H-009 Â· CSP con `unsafe-inline`/`unsafe-eval` por Tailwind CDN

- **Severidad:** Media
- **Estado:** Aceptado
- **DescripciÃ³n:** la CSP permite scripts inline y `eval` porque la UI carga
  Tailwind Play CDN y scripts inline. Esto debilita la defensa contra XSS.
- **Tratamiento:** se acepta mientras se use el CDN. La evoluciÃ³n es compilar
  Tailwind en el build, retirar `unsafe-inline`/`unsafe-eval` y usar nonces o
  hashes.
- **Riesgo residual:** medio. Se compensa con React (escape por defecto),
  `object-src 'none'`, `base-uri 'self'` y `frame-ancestors 'self'`.

### H-010 Â· CSP permitÃ­a un origen de Gemini ya no usado

- **Severidad:** Baja
- **Estado:** Resuelto
- **DescripciÃ³n:** la CSP incluÃ­a `https://generativelanguage.googleapis.com`
  despuÃ©s de eliminar la integraciÃ³n con Gemini. Era un permiso innecesario.
- **Tratamiento:** se retirÃ³ el origen y se actualizÃ³ el comentario de
  `docker/nginx/snippets/security-headers.conf`.
- **VerificaciÃ³n:** `grep -R "generativelanguage"` sin resultados en el cÃ³digo y
  en la configuraciÃ³n; `nginx -t` en la imagen.

### H-011 Â· AutenticaciÃ³n deshabilitada en el overlay local

- **Severidad:** Media (si se expone) / Baja (en local)
- **Estado:** Aceptado con control
- **DescripciÃ³n:** `AI_AUTH_MODE=disabled` permite probar sin Supabase. Si ese
  modo se aplicara a producciÃ³n, cualquiera podrÃ­a consumir la IA como anÃ³nimo.
- **Tratamiento:** el overlay local es el Ãºnico que lo activa; la configuraciÃ³n
  falla al arrancar si `AI_ENVIRONMENT=production` y `AI_AUTH_MODE=disabled`. La
  documentaciÃ³n advierte que no debe exponerse a Internet.
- **Riesgo residual:** bajo, con el fail-fast como red de seguridad.

### H-012 Â· Sin clÃºster ni registro de producciÃ³n; imÃ¡genes locales sin firma

- **Severidad:** Media
- **Estado:** Aceptado
- **DescripciÃ³n:** el entorno solo tiene Docker Desktop. Las imÃ¡genes
  `tuki:local-0.2.0` y `tuki-ai-gateway:local-0.2.0` no estÃ¡n firmadas ni
  publicadas; Cosign y GHCR solo se ejecutan en GitHub Actions.
- **Tratamiento:** se documenta como limitaciÃ³n. Antes de producciÃ³n hay que
  publicar, firmar, verificar y desplegar por digest.
- **Riesgo residual:** medio, aceptado por el alcance del trabajo.

### H-013 Â· NetworkPolicy no aplicada en Docker Desktop/kind por defecto

- **Severidad:** Media
- **Estado:** Aceptado en local
- **DescripciÃ³n:** el overlay local elimina las NetworkPolicy porque Docker
  Desktop y el CNI por defecto de kind no las aplican de forma fiable. En
  producciÃ³n sÃ­ se incluyen, pero dependen del CNI.
- **Tratamiento:** el overlay de producciÃ³n las conserva; el README advierte de
  la dependencia del CNI y de las sondas del kubelet.
- **Riesgo residual:** medio en local; bajo en producciÃ³n con un CNI compatible.

### H-014 Â· CachÃ© de imÃ¡genes por tag en Docker Desktop

- **Severidad:** Baja
- **Estado:** Resuelto operativamente
- **DescripciÃ³n:** Docker Desktop puede reutilizar una imagen con el mismo tag y
  desplegar configuraciÃ³n vieja.
- **Tratamiento:** tags Ãºnicos (`local-0.2.0`, `local-0.2.1`, â€¦) y documentaciÃ³n
  en `deploy/README.md` Â§7.2. En producciÃ³n se usa digest.
- **Riesgo residual:** bajo.

### H-015 Â· `apk upgrade` hace que el build no sea bit a bit reproducible

- **Severidad:** Baja
- **Estado:** Aceptado
- **DescripciÃ³n:** la etapa runtime de la web ejecuta `apk upgrade --no-cache`
  para aplicar parches publicados despuÃ©s del digest de la base. Dos builds del
  mismo commit pueden diferir en parches del sistema operativo.
- **Tratamiento:** se acepta como excepciÃ³n consciente; el SBOM y el digest de
  la imagen publicada registran lo que se desplegÃ³. Ver ADR 0002.
- **Riesgo residual:** bajo.

### H-016 Â· Sin ESLint ni `tsc --noEmit` en CI

- **Severidad:** Media
- **Estado:** Abierto
- **DescripciÃ³n:** el build de Vite usa esbuild y no hace comprobaciÃ³n de tipos.
  `pnpm exec tsc --noEmit` falla hoy con errores en componentes del panel,
  `Boton.tsx`, `ErrorBoundary.tsx` y pÃ¡ginas en curso. No hay ESLint.
- **Tratamiento propuesto:** corregir los errores de tipos en una rama aparte,
  aÃ±adir `tsc --noEmit` y ESLint al job `validar-web`. No se aÃ±adiÃ³ ahora para
  no bloquear el trabajo de frontend en curso.
- **Riesgo residual:** medio: un error de tipos puede llegar a producciÃ³n.

### H-017 Â· Preset de Cloudinary sin firma expuesto al navegador

- **Severidad:** Media
- **Estado:** Abierto (contextual)
- **DescripciÃ³n:** el preset de subida es pÃºblico por diseÃ±o. Un atacante puede
  subir imÃ¡genes y consumir cuota o almacenamiento si el preset no estÃ¡
  restringido.
- **Tratamiento propuesto:** limitar formatos, tamaÃ±o, carpeta y transformaciones
  en Cloudinary; activar alertas de cuota; considerar subida firmada si el flujo
  lo permite.
- **Riesgo residual:** medio, fuera del repositorio.

### H-018 Â· Posible envÃ­o de datos personales o de negocio a Groq

- **Severidad:** Media
- **Estado:** Aceptado con polÃ­tica
- **DescripciÃ³n:** el `prompt` lo construye el cliente. Si incluye correos,
  telÃ©fonos o datos internos, se envÃ­an a un proveedor externo.
- **Tratamiento:** el gateway no aÃ±ade PII; la polÃ­tica es no enviar datos
  personales y limitar el prompt a texto de menÃºs o marketing. Se documenta en
  el modelo de amenazas.
- **Riesgo residual:** medio. No hay filtro automÃ¡tico de PII.

### H-019 Â· Sin revisiÃ³n automatizada de licencias

- **Severidad:** Baja
- **Estado:** Abierto
- **DescripciÃ³n:** el CI no revisa licencias de dependencias. Una dependencia
  con licencia incompatible podrÃ­a pasar inadvertida.
- **Tratamiento propuesto:** aÃ±adir `pnpm licenses ls` o una herramienta de
  polÃ­tica de licencias al job de auditorÃ­a.
- **Riesgo residual:** bajo.

### H-020 Â· Sin retenciÃ³n definida de SBOM, logs y evidencias

- **Severidad:** Baja
- **Estado:** Abierto
- **DescripciÃ³n:** los SBOM se generan como artefactos de GitHub Actions, pero no
  hay una polÃ­tica de retenciÃ³n ni un archivo de release a largo plazo.
- **Tratamiento propuesto:** adjuntar SBOM y firmas al release, definir retenciÃ³n
  y documentarla en el runbook.
- **Riesgo residual:** bajo.

### H-021 Â· Sin WAF ni protecciÃ³n DDoS de aplicaciÃ³n

- **Severidad:** Media
- **Estado:** Aceptado
- **DescripciÃ³n:** no hay reglas de WAF, reputaciÃ³n de IP ni bloqueo por ASN. El
  rate limit del gateway no protege la SPA ni el Ingress de un ataque volumÃ©trico.
- **Tratamiento:** se confÃ­a en el proveedor de Ingress y, si existe, en un CDN
  delante. La evoluciÃ³n es Cloudflare o reglas de ingress-nginx.
- **Riesgo residual:** medio.

### H-022 Â· Sin detecciÃ³n de runtime (Falco u equivalente)

- **Severidad:** Media
- **Estado:** Abierto
- **DescripciÃ³n:** hay prevenciÃ³n (hardening, NetworkPolicy, seccomp), pero no
  detecciÃ³n de comportamientos anÃ³malos dentro del contenedor.
- **Tratamiento propuesto:** evaluar Falco o Tetragon en un clÃºster de prueba y
  definir reglas para ejecuciÃ³n de shell, escritura en rutas sensibles y
  conexiones salientes inesperadas.
- **Riesgo residual:** medio.

---

## 3. Verificaciones limpias

Estas comprobaciones no son hallazgos, pero forman parte de la evidencia:

| VerificaciÃ³n | Resultado | Fecha |
| --- | --- | --- |
| Trivy `tuki:local-0.2.0` | 0 `HIGH`/`CRITICAL` corregibles | 2026-10-25 |
| Trivy `tuki-ai-gateway:local-0.2.0` | 0 `HIGH`/`CRITICAL` corregibles | 2026-10-25 |
| `pip-audit -r requirements.txt --require-hashes` | Sin vulnerabilidades conocidas | 2026-10-25 |
| `pnpm audit --prod` | Sin vulnerabilidades conocidas (H-005 cerrado) | 2026-10-27 |
| `pnpm typecheck` | Sin errores de tipos | 2026-10-27 |
| `pnpm test` | 36/36 pruebas | 2026-10-27 |
| `pnpm lint` | 0 errores, 15 avisos | 2026-10-27 |
| Licencias de producciÃ³n | Sin GPL/AGPL | 2026-10-27 |
| Bundle sin `gsk_`, `VITE_GROQ_API_KEY` ni `api.groq.com` | Correcto | 2026-10-25 |
| gitleaks | Sin secretos en el historial | 2026-10-27 |
| conftest | 369/369 | 2026-10-25 |
| kubeconform | 25 recursos, 22 vÃ¡lidos, 3 CRDs omitidos | 2026-10-25 |
| kube-linter | Sin errores | 2026-10-25 |
| Hadolint | Sin hallazgos | 2026-10-25 |
| Actionlint | Workflow vÃ¡lido | 2026-10-27 |
| Shellcheck | Scripts sin advertencias (incluido `demo-plataforma.sh`) | 2026-10-27 |
| Runtime Compose y K8s local | Chat real HTTP 200; pods no root | 2026-10-25 |
| Runtime K8s con Ingress, HPA y ArgoCD | `/healthz` y `/api/healthz` 200; HPA 1â†’2; deriva corregida | 2026-10-27 |

---

## 4. Seguimiento

| AcciÃ³n | Hallazgo | Prioridad | Estado |
| --- | --- | --- | --- |
| Actualizar React Router, Zod y `ws` | H-005 | P1 | Hecho (2026-10-27) |
| Auditar RLS y probar acceso cruzado | Modelo de amenazas I2 | P1 | Pendiente |
| Fijar Actions por SHA | H-008 | P2 | Hecho (2026-10-27) |
| AÃ±adir ESLint y `tsc --noEmit` | H-016 | P2 | Hecho (2026-10-27) |
| Evaluar admission controller | H-007 | P2 | Hecho con Kyverno; falta instalarlo en el clÃºster |
| Restringir preset de Cloudinary | H-017 | P2 | Pendiente |
| Compilar Tailwind y endurecer CSP | H-009 | P3 | Pendiente |
| Rate limit compartido | H-006 | P3 | Pendiente |
| RetenciÃ³n de SBOM y logs | H-020 | P3 | Pendiente |
| RevisiÃ³n de licencias | H-019 | P3 | Pendiente |
| Evaluar Falco/Tetragon | H-022 | P3 | Pendiente |

---

## 5. Referencias

- `docs/security/modelo-de-amenazas.md`
- `docs/security/registro-uso-ia.md`
- `docs/modulos-1-3.md`
- `deploy/README.md` Â§10 â€” cadena de suministro.
- `docs/adr/0002-cadena-de-suministro.md`
- `docs/adr/0004-rate-limit-en-memoria.md`
- `.github/workflows/contenedor.yml`
