# AGENTS.md — Tuki

Instrucciones para agentes de código (OpenCode, Claude Code, Codex, Cursor…) que
trabajen en este repositorio.

## Producto

Tuki es un constructor de sitios web para restaurantes con IA. Dos capas sobre la
misma base: **Descubrir** (buscador de platos para comensales) y el **panel** del
dueño (menú, temas, pedidos por WhatsApp, QR). El proyecto también es el
proyecto integrador del diplomado **CloudForge AI 5.0**, acotado a los módulos
**1–3**: fundamentos cloud native, Kubernetes/GitOps/Platform Engineering y
DevSecOps. La IA local (módulos 5–6) está fuera de alcance por decisión
explícita.

## Comandos

```bash
pnpm dev              # SPA en http://localhost:3000
pnpm build            # build de producción
pnpm typecheck        # tsc --noEmit
pnpm lint             # ESLint (máximo 20 avisos)
pnpm test             # Vitest (87 pruebas)
pnpm arquitectura     # reglas de dependencia entre módulos y capas
pnpm verificar        # puerta completa de los módulos 1–3
pnpm contexto         # mide el contexto de la sesión y propone recortes
pnpm mcp:verificar    # handshake de CodeGraph y Engram
pnpm mcp:ligero       # apaga los MCP para ahorrar contexto
pnpm mcp:completo     # los vuelve a encender
```

Gateway:

```bash
cd services/ai-gateway
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8001   # Windows
pytest -q
ruff check app tests
```

Despliegue y validación:

```bash
bash deploy/scripts/validar-k8s.sh
bash deploy/scripts/demo-plataforma.sh verificar
```

## Economía de contexto

Cada paso reenvía todo el historial: el coste crece con el tamaño de la
conversación multiplicado por el número de pasos. El piso fijo (sistema +
AGENTS.md + catálogo MCP) ronda 6–8k tokens; el resto lo pone el historial.

- Mide antes de optimizar: `pnpm contexto`. Devuelve el contexto de la última
  petición, las salidas más grandes y el recorte concreto.
- Nunca vuelques archivos o logs completos. Filtra (`grep -m`, `-First`, `-Tail`)
  y lee con `limit`/`offset`. Una salida de más de 16 KB se resume o se guarda
  en un archivo.
- Agrupa en una sola tanda las llamadas independientes y no releas lo que ya
  está en el historial. No repitas en el chat archivos completos ni tablas ya
  emitidas: enlaza la ruta.
- Para búsquedas amplias, delega en el subagente `explore` (`/explorar …`):
  trabaja en su propio contexto y devuelve solo lo esencial.
- Compacta (`/compact`) al cerrar un bloque; antes guarda en Engram la decisión
  y su porqué. `compaction.prune` descarta las salidas viejas automáticamente.
- Si la tarea no toca código ni memoria, usa `pnpm mcp:ligero` y vuelve con
  `pnpm mcp:completo`.
- Presupuesto: no pases de ~60k tokens de contexto sin una razón; a partir de
  80k, compacta.

Detalle, mediciones y fuentes: `docs/herramientas/ahorro-contexto.md`.

## Herramientas MCP

`opencode.json` registra CodeGraph, Engram y Supabase. OpenCode los expone por
Code Mode (`execute` + `search()`): el catálogo completo no viaja en cada turno,
solo lo que se descubre. Búscalas por nombre dentro de `execute`; no pidas
volcar el catálogo. Úsalas antes de recurrir a `grep` o a leer a ciegas.

### CodeGraph — estructura del código

- `codegraph_get_curated_context`: contexto de una funcionalidad concreta.
- `codegraph_analyze_impact`: qué se rompe si cambias un símbolo.
- `codegraph_find_circular_deps`: ciclos de importación.
- `codegraph_find_related_tests`: pruebas que cubren un archivo.
- `codegraph_get_edit_context`: contexto exacto alrededor de una línea.

Regla: para preguntas de arquitectura, impacto de un cambio o dependencias,
consulta el grafo primero. Para texto literal (un mensaje, un color, una clave),
`grep` sigue siendo más barato.

### Engram — memoria del proyecto

- `mem_context`: recupera el historial reciente al empezar o tras una compactación.
- `mem_search`: busca decisiones anteriores por tema.
- `mem_save`: guarda decisiones, hallazgos y convenciones **cuando ocurren**.
- `mem_session_summary`: cierra la sesión con un resumen.

Proyecto: `tuki`. Nunca guardes secretos, tokens, datos personales ni contenido
de `.env.local`. Guarda el *porqué* de una decisión, no el volcado del código.

## Convenciones

- Commits en español con prefijo convencional: `feat`, `fix`, `docs`, `style`,
  `refactor`, `chore`, `test`.
- Ramas: `feat/…`, `fix/…`, `docs/…`, `style/…`; se integran a `main` con
  `--no-ff`.
- Código y documentación en español; identificadores en español cuando el
  dominio lo es (`platillo`, `restaurante`).
- No introduzcas dependencias sin revisar licencia (`node scripts/licencias.mjs`).
- Todo cambio asistido por IA se registra en `docs/security/registro-uso-ia.md`.

## Reglas de seguridad

- `.env.local` nunca se versiona; solo `.env.example` sin valores.
- No ejecutes comandos destructivos sobre el clúster sin confirmación.
- Los manifiestos deben pasar `kubectl kustomize` y las políticas de
  `deploy/policies/`.
- Si cambias una imagen, el SBOM y la firma se generan en CI, no a mano.
