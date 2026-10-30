# Ahorro de contexto en Tuki

Una sesión de agente no cuesta por el prompt inicial, sino por el historial: cada
paso reenvía los mensajes anteriores, las salidas de herramientas y el catálogo
de herramientas. Este documento registra qué se integró, cómo se mide y qué
reglas aplica el equipo (personas y agentes).

## Qué se integró

| Cambio | Dónde | Efecto |
| --- | --- | --- |
| Poda de salidas viejas | `opencode.json` → `compaction.prune: true` | Al compactar se descartan las salidas de herramientas que ya no aportan, en vez de reenviarlas. |
| Code Mode explícito | `opencode.json` → `mcp.servers.*.codemode: true` | Las herramientas MCP se descubren bajo demanda dentro de `execute`; el catálogo completo no viaja en cada turno. |
| Límites de salida | `opencode.json` → `tool_output` (300 líneas / 16 KB) | Un volcado accidental se trunca y queda en disco; el modelo ve solo el extracto. |
| Informe de contexto | `scripts/contexto.mjs` → `pnpm contexto` | Mide la última petición, el acumulado y las salidas más grandes, y propone el recorte. |
| Comandos de sesión | `opencode.json` → `command.contexto` y `command.explorar` | `/contexto` mide sin gastar un turno de shell; `/explorar` delega en el subagente `explore`. |
| Presupuesto explícito | `AGENTS.md` → «Economía de contexto» | Reglas de filtrado, delegación y umbrales (60k / 80k tokens). |
| Modo ligero | `pnpm mcp:ligero` | Apaga CodeGraph y Engram cuando la tarea no toca código ni memoria. |

`compaction.prune` figura como obsoleto en el esquema de OpenCode, pero sigue
siendo la opción documentada para descartar salidas antiguas. Se mantiene junto a
`compaction.keep` y `compaction.buffer`, que ya estaban configurados.

## Cómo medir

```bash
pnpm contexto                 # última sesión del proyecto
pnpm contexto -- --limite 8   # más filas en las tablas
pnpm contexto -- --sesion ses_... --json
```

Salida típica (sesión del 28/10/2026, recortada):

```text
Contexto de la sesión «Ahorro de tokens en el proyecto»
  contexto  ~78.6k tokens en la última petición
  acumulado 1478.9k tokens de entrada (1332.0k en caché)
  coste     0.0117 USD

Salidas de herramientas (55 llamadas, ~38.7k tokens)
  shell       26 llamadas    71.0 KB
  websearch    2 llamadas    26.9 KB

Mayores salidas (umbral 16 KB)
   1. shell        17.1 KB  Select-String ...
   2. websearch    15.1 KB  opencode "codemode" MCP servers ...

Configuración
  poda=on · tool_output=300 líneas / 16000 bytes · mcp=completo
```

El script abre `~/.local/share/opencode/opencode.db` en modo `readOnly`; no
modifica la sesión. Requiere Node 22.13 o superior (`node:sqlite`). Si OpenCode
cambia el esquema, el informe falla con un mensaje claro en vez de tocar la base.

### Qué mirar

- **Contexto actual**: suma de tokens nuevos y de caché de la última petición.
  Por encima de 60k conviene delegar o compactar; por encima de 80k, compactar.
- **Salidas de herramientas**: si `shell`, `websearch` o `read` concentran el
  gasto, el problema es el tamaño de las salidas, no el prompt.
- **Mayores salidas**: cada fila trae el comando, la ruta o la consulta. Es la
  pista para filtrar la próxima vez.
- **Configuración**: confirma que la poda y los límites siguen activos.

## Métodos aplicados y por qué

### 1. Descubrimiento bajo demanda (Code Mode)

El catálogo completo de un MCP puede pesar más que el prompt. Medido con
`tools/list` en este repositorio:

| Servidor | Herramientas | Esquema completo |
| --- | --- | --- |
| CodeGraph | 42 | 42.017 bytes (~10.5k tokens) |
| Engram | 23 | 29.206 bytes (~7.3k tokens) |

Si ambos se expusieran como herramientas nativas, cada turno arrastraría ~18k
tokens solo en definiciones. Con Code Mode el modelo ve un catálogo reducido y
usa `search()`/`execute` para encontrar el resto. Es la misma idea que Cloudflare
aplicó a su API: dos herramientas y ~1.000 tokens en vez de 1,17 millones.

### 2. Poda y compactación

`compaction.auto` compacta al llenarse la ventana; `compaction.prune` elimina las
salidas de herramientas antiguas en ese momento. `keep.tokens: 10000` conserva
el hilo reciente y `buffer: 32000` deja margen para compactar sin desbordar.

### 3. Límites de salida

`tool_output` corta a 300 líneas o 16 KB. En la sesión de ejemplo, `shell`
acumuló 71 KB en 26 llamadas (~17.8k tokens); sin límite, un solo `Get-Content`
puede duplicar esa cifra. La regla es filtrar en origen (`grep -m`, `-First`,
`-Tail`, `limit`/`offset`) antes de que el límite global tenga que actuar.

### 4. Delegación en subagentes

`/explorar` ejecuta el subagente `explore` con `subtask: true`: la búsqueda
ocurre en un contexto aparte y al principal solo vuelve el resumen. Es útil para
preguntas amplias («¿dónde se calcula el contraste de la paleta?») que de otro
modo llenan el historial de lecturas.

### 5. Divulgación progresiva

`AGENTS.md` se carga siempre; por eso conserva solo comandos, reglas y umbrales.
El detalle vive aquí y en `docs/herramientas/codegraph-y-engram.md`, que el
agente lee solo cuando lo necesita.

## Reglas del equipo

1. Medir antes y después de un bloque pesado: `pnpm contexto`.
2. No pegar archivos ni logs completos en el chat; adjuntar rutas y extractos.
3. Una salida de más de 16 KB se filtra o se guarda en archivo y se resume.
4. Búsquedas amplias: `/explorar` o el subagente `explore`, no diez `read`.
5. Al cerrar un bloque: guardar la decisión en Engram y ejecutar `/compact`.
6. Tareas sin código ni memoria: `pnpm mcp:ligero`; al volver, `pnpm mcp:completo`.

## Fuentes

- OpenCode, configuración de MCP y Code Mode:
  <https://opencode.ai/docs/mcp-servers/>
- OpenCode, compactación (`prune`, `keep`, `buffer`):
  <https://opencode.ai/docs/config/#compaction>
- OpenCode, límites de salida de herramientas:
  <https://opencode.ai/docs/config/#tools> y el esquema
  <https://opencode.ai/config.json>
- Propuesta de filtrado de herramientas MCP en OpenCode:
  <https://github.com/anomalyco/opencode/issues/7399> y
  <https://github.com/anomalyco/opencode/issues/8625>
- Cloudflare, «Code Mode: give agents an entire API in 1,000 tokens»:
  <https://blog.cloudflare.com/code-mode-mcp/>
- OpenCode, comandos con `subtask`:
  <https://opencode.ai/docs/commands/#subtask>

## Mantenimiento

- `pnpm contexto` es informativo: no forma parte de `pnpm verificar` ni del CI.
- Si OpenCode cambia el esquema de `session_v2`, actualizar
  `scripts/contexto.mjs` y este documento.
- Al añadir un MCP nuevo, comprobar su coste con `pnpm contexto` en una sesión
  real antes de dejarlo siempre encendido.
