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
pnpm test             # Vitest (36 pruebas)
pnpm mcp:verificar    # handshake de CodeGraph y Engram
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

## Herramientas MCP

Este repo registra dos servidores MCP locales en `opencode.json`. Úsalos antes
de recurrir a `grep` o a leer archivos a ciegas.

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
