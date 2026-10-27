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
| 2026-10-27 | Fase A de reseñas | Asistente de código (OpenCode) | Hacer visibles las valoraciones existentes, permitir escribir una reseña pendiente, moderarla en el panel y compartir la ficha sin sacar el buscador de la portada | `src/lib/resenas.ts`, `src/api/apiResenas.ts`, `src/hooks/useResenas.ts`, `src/componentes/restaurante/{ResenasPublicas,FormularioResena,PlantillaRestaurante}.tsx`, `src/componentes/panel/SeccionResenas.tsx`, `src/componentes/sistema-diseno/{Estrellas,Avatar}.tsx`, `db/sql-resenas.sql` | `pnpm test` 50, `pnpm typecheck`, `pnpm lint`; revisión visual de la ficha sin sesión; RLS pendiente de aplicar en Supabase | Pendiente de revisión por pares | Aceptado con migración pendiente |
| 2026-10-27 | Supabase MCP remoto | Asistente de código (OpenCode) | Conectar el proyecto de Supabase al agente en modo lectura para consultar esquema, políticas y documentación | `opencode.json`, `docs/herramientas/codegraph-y-engram.md` | `mcp list`: servidor declarado y a la espera de OAuth; sin claves en el archivo | Pendiente de revisión por pares | Aceptado con OAuth pendiente |

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
