# Registro de uso de IA en el desarrollo de Tuki

Plantilla y registro para el control de **software generado o asistido por IA**
del módulo 3. No implementa IA local ni modelos en el clúster: solo documenta
qué se aceptó, cómo se validó y quién lo revisó.

Regla base: **la IA puede acelerar el trabajo, pero la responsabilidad del
artefacto es humana**. Ningún cambio generado por un modelo se acepta sin
pruebas, linters, revisión y comparación con la documentación oficial.

---

## 1. Controles mínimos

Antes de aceptar un cambio asistido por IA:

- [ ] El cambio está en un PR revisable, no aplicado directamente a producción.
- [ ] Pasa las pruebas automatizadas del módulo afectado.
- [ ] Pasa los linters y el build.
- [ ] Se revisaron las dependencias añadidas o actualizadas.
- [ ] No contiene secretos, tokens, correos ni datos personales.
- [ ] No se pegó información confidencial en el prompt.
- [ ] Se comparó la API, el manifiesto o el comando con la documentación oficial.
- [ ] Se revisó la licencia de cualquier fragmento o dependencia nueva.
- [ ] Una persona distinta de quien generó el cambio lo revisó (cuando sea posible).
- [ ] El riesgo residual quedó registrado en `docs/security/hallazgos.md`.

Controles automáticos que ya existen en el repositorio:

| Control | Comando o job |
| --- | --- |
| Pruebas del gateway | `pytest` |
| Lint Python | `ruff check app tests` |
| Build del frontend | `pnpm build` |
| Lint de Dockerfile | Hadolint |
| Esquema y políticas K8s | kubeconform, kube-linter, conftest |
| Vulnerabilidades Python | `pip-audit -r requirements.txt --require-hashes` |
| Vulnerabilidades frontend | `pnpm audit --prod` |
| Secretos en el bundle | grep de `gsk_`, `VITE_GROQ_API_KEY`, `api.groq.com` |
| Workflow | actionlint |
| Scripts | shellcheck |

---

## 2. Reglas de prompts

- No incluir claves, tokens, cadenas de conexión, correos, teléfonos ni datos de
  clientes.
- No pegar volcados completos de la base de datos ni logs con PII.
- Describir el objetivo, las restricciones y los archivos relevantes; evitar
  “genera todo el proyecto” sin contexto.
- Pedir explicaciones y alternativas, no solo código.
- Verificar las respuestas del modelo contra la documentación oficial.
- Si el modelo propone un comando destructivo, revisarlo antes de ejecutarlo.
- No aceptar dependencias nuevas sin revisar mantenimiento, licencia y
  vulnerabilidades.

---

## 3. Registro

Cada fila documenta un cambio relevante. Las fechas son las de la revisión, no
necesariamente las de la generación.

| Fecha | Cambio | Asistencia | Resumen del prompt | Archivos | Validación | Revisor | Decisión |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10-25 | AI Gateway, tests y manifiestos | Asistente de código (OpenCode) | Diseñar un gateway FastAPI con auth Supabase, cuotas, retries y métricas; generar Dockerfile, K8s y CI | `services/ai-gateway/`, `deploy/`, `.github/workflows/contenedor.yml` | `pytest` 39, `ruff`, Hadolint, kubeconform, kube-linter, conftest 189/189, Trivy, `pip-audit` | Pendiente de revisión por pares | Aceptado con hallazgos abiertos |
| 2026-10-25 | Documentos de módulos 1–3 | Asistente de código (OpenCode) | Ordenar la matriz de cumplimiento, el modelo de amenazas y la bitácora de hallazgos | `docs/modulos-1-3.md`, `docs/security/`, `docs/plataforma/`, `catalog-info.yaml` | Validación YAML, actionlint, revisión manual de referencias | Pendiente de revisión por pares | Aceptado |
| 2026-10-25 | Clúster kind y golden path | Asistente de código (OpenCode) | Configurar un clúster local reproducible y documentar el camino para servicios nuevos | `deploy/kind/`, `docs/plataforma/catalogo-backstage.md` | YAML válido; `kind` no ejecutado en este entorno | Pendiente de revisión por pares | Aceptado con limitación de runtime |
| 2026-10-27 | Ahorro de contexto del agente | Asistente de código (OpenCode) | Medir el consumo de tokens por sesión, topar la salida de herramientas, compactar antes y permitir apagar los MCP | `opencode.json`, `AGENTS.md`, `scripts/modo-agente.mjs`, `package.json` | `pnpm mcp:verificar`, `mcp:estado`/`ligero`/`completo`, `pnpm lint`, `pnpm typecheck` | Pendiente de revisión por pares | Aceptado |
| 2026-10-27 | Revisión de cierre de los módulos 1–3 | Asistente de código (OpenCode) | Contrastar los artefactos con el PDF del diplomado, corregir codificación, hacer reproducibles los scripts en Windows y añadir la puerta local de verificación | `docs/modulos-1-3.md`, `.gitattributes`, `scripts/verificar-proyecto.mjs`, `scripts/validar-catalogo.py`, `deploy/scripts/validar-k8s.sh`, `.github/workflows/contenedor.yml` | `pnpm verificar` 11/11, `validar-k8s.sh` (42 válidos, 225/225), runtime Compose y clúster local | Pendiente de revisión por pares | Aceptado |
| 2026-10-27 | Auditoría de módulos 1–3 y migración de Kyverno | Asistente de código (OpenCode) | Auditar el repositorio contra el temario y migrar las políticas de admisión a la API CEL vigente | `docs/auditoria-modulos-1-3.md`, `SECURITY.md`, `deploy/security/kyverno/`, `deploy/scripts/validar-kyverno.sh`, `.github/workflows/contenedor.yml` | `validar-kyverno.sh` (conforme pasa, inseguro se rechaza), `pnpm verificar` 11/11, actionlint | Pendiente de revisión por pares | Aceptado |
| 2026-10-27 | Kyverno instalado y protección de rama automatizada | Asistente de código (OpenCode) | Cerrar las brechas de infraestructura del módulo 3 en el laboratorio y dejar la protección de `main` como script reproducible | `scripts/configurar-proteccion-rama.sh`, `docs/auditoria-modulos-1-3.md`, `docs/modulos-1-3.md`, `docs/security/hallazgos.md` | Kyverno 1.19 `Running`, política `READY`, rechazo real de pod inseguro; `bash -n` del script | Pendiente de revisión por pares | Aceptado |
| 2026-10-27 | Marca modular y propuesta de red social | Asistente de código (OpenCode) | Reemplazar la «R» por una «T» de mesa, convertir el logo en un sistema de símbolo, logotipo y descriptor, y proponer la capa social sin romper el buscador | `src/componentes/sistema-diseno/Logo.tsx`, `src/componentes/descubrir/BarraDescubrir.tsx`, `src/componentes/panel/BarraLateral.tsx`, `src/paginas/PaginaParaRestaurantes.tsx`, `index.html`, `docs/marca/`, `docs/producto/red-social-restaurantes.md` | `pnpm verificar` 11/11; revisión visual en claro y oscuro a 3011; favicon y hoja de marca renderizados | Pendiente de revisión por pares | Aceptado |
| 2026-10-27 | Fase A de reseñas | Asistente de código (OpenCode) | Hacer visibles las valoraciones existentes, permitir escribir una reseña pendiente, moderarla en el panel y compartir la ficha sin sacar el buscador de la portada | `src/lib/resenas.ts`, `src/api/apiResenas.ts`, `src/hooks/useResenas.ts`, `src/componentes/restaurante/{ResenasPublicas,FormularioResena,PlantillaRestaurante}.tsx`, `src/componentes/panel/SeccionResenas.tsx`, `src/componentes/sistema-diseno/{Estrellas,Avatar}.tsx`, `db/sql-resenas.sql` | `pnpm test` 50, `pnpm typecheck`, `pnpm lint`; migración `resenas_fase_a` aplicada (versión `20261027220739`); RLS verificado con `set local role` y rollback (autor ve pendiente, anon no, dueño aprueba, anon ve publicada) | Pendiente de revisión por pares | Aceptado |
| 2026-10-27 | Supabase MCP remoto | Asistente de código (OpenCode) | Conectar el proyecto de Supabase al agente para consultar esquema, políticas y aplicar la migración de reseñas con autorización del usuario | `opencode.json`, `docs/herramientas/codegraph-y-engram.md` | `mcp list`: connected; `apply_migration` aplicada; MCP devuelto a `read_only=true` tras la escritura | Pendiente de revisión por pares | Aceptado |
| 2026-10-27 | Fotos y respuestas de reseñas | Asistente de código (OpenCode) | Cerrar A2b sin abrir un bucket nuevo: subir la foto de la reseña al Cloudinary del proyecto, mostrarla en la ficha y permitir que el dueño responda en público | `src/lib/imagenes.ts`, `src/lib/resenas.ts`, `src/api/apiResenas.ts`, `src/componentes/restaurante/{FormularioResena,ResenasPublicas}.tsx`, `src/componentes/panel/SeccionResenas.tsx`, `tests/frontend/{imagenes,resenas}.test.ts` | `pnpm test` 57, `pnpm typecheck`, `pnpm lint` (0 errores), `pnpm build`; subida real al preset sin firmar verificada con `curl` | Pendiente de revisión por pares | Aceptado |
| 2026-10-27 | Cuenta del comensal y pedidos | Asistente de código (OpenCode) | Dar historial al comensal y bandeja al restaurante sin cambiar el canal del pedido: se mantiene WhatsApp y se guarda una copia para consultar estado | `db/sql-cuenta-y-pedidos.sql`, `src/lib/pedidos.ts`, `src/api/apiPedidos.ts`, `src/paginas/PaginaMiCuenta.tsx`, `src/componentes/cuenta/{MisResenas,MisPedidos}.tsx`, `src/componentes/panel/SeccionPedidos.tsx`, `src/componentes/descubrir/BarraDescubrir.tsx`, `src/componentes/rutas/RutasProtegidas.tsx` | `pnpm test` 67, `pnpm typecheck`, `pnpm lint` (0 errores), `pnpm build`; migración aplicada y RLS verificado con `set local role` y rollback | Pendiente de revisión por pares | Aceptado |
| 2026-10-27 | Integridad de reseñas y pedidos | Asistente de código (OpenCode) | Cerrar el hueco que impedía a «Mi cuenta» resolver el restaurante de cada reseña y verificar el flujo completo con cuentas reales | `db/sql-cuenta-y-pedidos.sql`, `docs/producto/red-social-restaurantes.md` | Migración `resenas_pedidos_fk` aplicada; `pnpm verificar` 11/11; recorrido manual: reseña con foto, moderación, respuesta, borrado propio, pedido guardado y cambio de estado | Pendiente de revisión por pares | Aceptado |
| 2026-10-27 | Datos de envío de la cuenta | Asistente de código (OpenCode) | Pedir teléfono y dirección al crear la cuenta de comensal, con una salida clara para completarlos más tarde, guardarlos en `public.users` y reutilizarlos en los carritos | `db/sql-datos-envio.sql`, `src/lib/datosEnvio.ts`, `src/api/apiCuenta.ts`, `src/hooks/useDatosEnvio.ts`, `src/componentes/cuenta/{FormularioDatosEnvio,SeccionDatosEnvio}.tsx`, `src/componentes/autenticacion/FormularioRegistro.tsx`, `src/paginas/PaginaMiCuenta.tsx`, `src/componentes/descubrir/PanelCarrito.tsx`, `src/componentes/restaurante/ModalCarrito.tsx`, `tests/frontend/datosEnvio.test.ts` | `pnpm test` 74, `pnpm typecheck`, `pnpm lint` (0 errores, 12 avisos), `pnpm build`; migración `datos_envio_cuenta` aplicada; RLS verificado con `set local role` y rollback; E2E con dos cuentas nuevas (guardar, omitir y completar después) y pedido con la dirección guardada | Pendiente de revisión por pares | Aceptado |
| 2026-10-28 | Contenedores de frontend y backend | Asistente de código (OpenCode) | Renombrar los servicios de Compose a `frontend` y `backend`, alinear el upstream de Nginx y el Service de Kubernetes, y conservar un alias `ai-gateway` durante el rollout | `docker-compose.yml`, `docker/nginx/conf.d/default.conf`, `deploy/k8s/base/{ai-gateway-service,ingress}.yaml`, `deploy/observability/prometheusrule.yaml`, documentación de despliegue | `docker compose config --quiet`; `kubectl kustomize` en base y los tres overlays; revisión de referencias | Pendiente de revisión por pares | Aceptado |
| 2026-10-29 | Arranque local con un solo clic | Asistente de código (OpenCode) | Crear un `.bat` que arranque Docker Desktop, espere a Kubernetes, construya las imágenes si faltan, aplique el overlay local y abra la app en el navegador | `iniciar-tuki.bat`, `.gitattributes` | Ejecución real: Docker y Kubernetes listos, imágenes reutilizadas, overlay aplicado, pods `1/1` y `2/2` Running, `/healthz` y `/api/healthz` con HTTP 200, navegador en `http://localhost:8081` | Pendiente de revisión por pares | Aceptado |
| 2026-10-29 | Contenedores visibles en Docker Desktop | Asistente de código (OpenCode) | Añadir un modo Docker Compose por defecto al `.bat` para que `tuki-frontend` y `tuki-backend` aparezcan en Docker Desktop, dejando `/k8s` para el despliegue en el clúster, y fijar los nombres de contenedor en Compose | `docker-compose.yml`, `iniciar-tuki.bat` | Ejecución real: `docker ps` muestra `tuki-frontend` (healthy, `8080`) y `tuki-backend` (healthy, `8001`), `/healthz` y `/api/healthz` con HTTP 200; `docker compose config --images` resuelve `tuki:local-0.3.0` y `tuki-ai-gateway:local-0.3.0`; `kubectl rollout restart` aplicado y Service `ai-gateway` obsoleto eliminado | Pendiente de revisión por pares | Aceptado |
| 2026-10-30 | Capa edge, coherencia de cuota, SLO y promoción GitOps | Asistente de código (OpenCode) | Cerrar las brechas de mayor impacto de los módulos 2–3: WAF y cuota global en Cloudflare, gateway con una sola réplica para que la cuota en memoria sea exacta, SLO con alertas de burn-rate y promoción de imágenes por PR verificado con Cosign | `deploy/cloudflare/`, `scripts/cloudflare/`, `deploy/k8s/base/ai-gateway-deployment.yaml`, `deploy/k8s/base/ai-gateway-pdb.yaml`, `deploy/observability/slo.yaml`, `.github/workflows/promover.yml`, `scripts/promover-imagen.mjs`, `docs/arquitectura/{rate-limit,slo}.md` | `kubectl kustomize` en base, `local`, `production`, `cloudflare` y `observability`; `node --check` de los scripts; `pnpm typecheck`, `pnpm lint` (0 errores), `pnpm test` 79, `pnpm arquitectura` | Pendiente de revisión por pares | Aceptado |
| 2026-10-30 | Guía de preparación para la reunión con el profesor | Asistente de código (OpenCode) | Ordenar el discurso del proyecto, la arquitectura, las decisiones con su alternativa descartada y un banco de preguntas y respuestas para la sustentación | `docs/entrega/guia-reunion-profesor.md` | Contraste con el repositorio: cifras de pruebas, ADRs, manifiestos y hallazgos verificadas contra el código en `main` | Pendiente de revisión por pares | Aceptado |
| 2026-10-30 | Imágenes en Supabase Storage | Asistente de código (OpenCode) | Retirar Cloudinary y servir las imágenes desde buckets de Supabase, con compresión WebP en el navegador y RLS por bucket | `src/lib/almacenamiento.ts`, `src/lib/servicios.ts`, `src/constantes.ts`, `db/migraciones/2026-10-29-storage-imagenes.sql`, `scripts/migrar-imagenes-supabase.mjs`, `docs/adr/0008-imagenes-en-supabase-storage.md`, `docs/arquitectura/almacenamiento-imagenes.md`, `Dockerfile`, `docker-compose.yml`, `.github/workflows/contenedor.yml` | `pnpm typecheck`, `pnpm test` 79, `pnpm lint` (0 errores), `pnpm test:e2e` 4 en chromium y móvil; migración de datos pendiente de aplicar el SQL y ejecutar el script con la clave de servicio | Pendiente de revisión por pares | Aceptado |
| 2026-10-31 | IA fallaba con la sesión iniciada y el acceso confundía comensal con restaurante | Asistente de código (OpenCode) | Validar los JWT HS256 de Supabase contra GoTrue con la clave pública `anon`, cachear el resultado y hacer explícito el tipo de cuenta en `/auth` y `/entrar` | `services/ai-gateway/app/adaptadores/supabase.py`, `services/ai-gateway/app/config.py`, `docker-compose.yml`, `deploy/k8s/base/ai-gateway-deployment.yaml`, `src/componentes/autenticacion/SelectorTipoCuenta.tsx`, `src/paginas/PaginaAutenticacion.tsx`, `src/paginas/PaginaEntrar.tsx`, `src/componentes/autenticacion/FormularioLogin.tsx`, `src/componentes/autenticacion/FormularioRegistro.tsx` | `pytest` 47, `ruff check` limpio, `pnpm typecheck`, `pnpm test` 79, `pnpm lint` (0 errores), `pnpm build`; prueba manual del gateway con un token HS256 real contra Supabase y revisión visual de `/auth` y `/entrar` | Pendiente de revisión por pares | Aceptado |
| 2026-10-31 | Documentar el despliegue real en Dokploy | Asistente de código (OpenCode) | Conservar el contexto operativo del VPS (topología, deploy key, variables, dominio, diagnóstico y pendientes) para poder repetirlo o diagnosticarlo sin reconstruir la historia | `docs/plataforma/despliegue-dokploy.md`, `docs/runbook.md`, `docs/estructura.md` | Contraste con el panel de Dokploy, el repositorio y las comprobaciones en vivo del sitio | Pendiente de revisión por pares | Aceptado |
| 2026-10-31 | Portada de Descubrir con el sistema «Warm Culinary Hearth» | Asistente de código (OpenCode) | Rehacer la portada siguiendo `code.html` y `DESIGN.md`: hero con cifras reales, carriles de cocinas y restaurantes, feed con favoritos y ficha rápida, barra móvil y carrito; modo oscuro coherente y accesibilidad | `index.html`, `public/robots.txt`, `src/paginas/PaginaDescubrir.tsx`, `src/componentes/descubrir/`, `src/hooks/useFavoritos.ts` | `tsc --noEmit`, `eslint` (0 errores, 12 avisos preexistentes), `vitest` 79, `verificar-arquitectura` 53 archivos, `vite build`; Lighthouse 100 en accesibilidad, buenas prácticas y SEO; revisión visual a 390, 768 y 1280 px en claro y oscuro | Pendiente de revisión por pares | Aceptado |
| 2026-10-31 | Portada más corta: filtros plegables y platos primero | Asistente de código (OpenCode) | Quitar el banner de bienvenida, subir las cocinas y el feed, mostrar solo seis cocinas con un panel desplegable para el resto y dejar un atajo a los restaurantes | `src/componentes/descubrir/CarrilCocinas.tsx`, `src/componentes/descubrir/HeroDescubrir.tsx`, `src/paginas/PaginaDescubrir.tsx` | `tsc --noEmit`, `eslint` (0 errores, 12 avisos preexistentes), `vitest` 79, `verificar-arquitectura` 53 archivos, `vite build`; Lighthouse 100 en accesibilidad, buenas prácticas y SEO; revisión a 390 y 1280 px en claro y oscuro, con filtro y panel probados | Pendiente de revisión por pares | Aceptado |
| 2026-11-01 | Fondo oscuro tostado y landing de restaurantes con el sistema «Warm Culinary Hearth» | Asistente de código (OpenCode) | Cambiar el modo oscuro a #131110 de lienzo y #1F1C1A de superficie, y llevar la landing de `/para-restaurantes` a la temática de Descubrir: paleta cálida, tipografía Plus Jakarta, tarjetas blancas con borde cálido, rótulos de sección y cierre en espresso; añadir en su barra el conmutador «Explorar / Para restaurantes» para saltar entre las dos portadas | `index.html`, `public/styles/apple-tokens.css`, `src/paginas/PaginaParaRestaurantes.tsx`, `src/componentes/landing/` | `tsc --noEmit`, `eslint` (0 errores, 12 avisos preexistentes), `vitest` 79, `verificar-arquitectura` 53 archivos, `vite build`; Lighthouse 100 en accesibilidad, buenas prácticas y SEO en `/para-restaurantes` y en Descubrir; revisión visual a 390, 800, 1024 y 1280 px en claro y oscuro | Pendiente de revisión por pares | Aceptado |

> **Nota:** el registro no incluye prompts completos porque pueden contener
> contexto interno. Se guarda un resumen y la evidencia de validación. Si un
> cambio es crítico, adjuntar el enlace al PR y a los artefactos de CI.

---

## 4. Criterios de rechazo

Se rechaza un cambio asistido por IA si:

- No se puede explicar qué hace y por qué.
- Introduce una dependencia sin revisar licencia y vulnerabilidades.
- Incluye secretos o datos personales en código, tests, logs o prompts.
- Desactiva un control de seguridad “para que pase el build”.
- No tiene pruebas para el comportamiento nuevo.
- Cambia configuración de producción sin un plan de rollback.
- Genera manifiestos que no cumplen las políticas de `deploy/policies/`.

---

## 5. Referencias

- `docs/security/modelo-de-amenazas.md` — riesgo de prompt injection y datos.
- `docs/security/hallazgos.md` — hallazgos y tratamiento.
- `docs/modulos-1-3.md` — matriz del módulo 3.
- `.github/workflows/contenedor.yml` — controles automáticos.
- `deploy/policies/kubernetes.rego` — políticas de admisión pre-despliegue.
