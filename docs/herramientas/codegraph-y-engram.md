# CodeGraph, Engram y Supabase en Tuki

Tres herramientas MCP que trabajan en capas distintas:

| Herramienta | Qué aporta | Dónde vive |
| --- | --- | --- |
| **CodeGraph** | Índice AST del repositorio expuesto como grafo: símbolos, llamadas, imports, impacto y ciclos. 42 herramientas. | `.tools/codegraph` (motor nativo, fuera de Git) |
| **Engram** | Memoria persistente por proyecto: decisiones, hallazgos y convenciones sobreviven a la sesión. 23 herramientas en perfil `agent`. | `.tools/engram/engram.exe` y su base local |
| **Supabase** | Esquema, políticas, SQL de solo lectura y documentación del proyecto. | Servidor remoto de Supabase (`mcp.supabase.com`), autenticado por OAuth |

Los dos primeros se registran en `opencode.json` como servidores MCP locales;
Supabase es remoto y opcional. Cualquier sesión abierta en la carpeta del
proyecto los ve sin configuración manual, salvo la primera autenticación de
Supabase.

## Instalación

```powershell
powershell -ExecutionPolicy Bypass -File scripts/instalar-herramientas.ps1
```

El script:

1. Descarga Engram 3.6.0 para Windows, **verifica el SHA256** contra el archivo
   oficial de checksums y lo extrae en `.tools/engram`.
2. Instala CodeGraph 0.21.0 en `.tools/codegraph` con npm (fuera de
   `package.json`).
3. Ejecuta `node scripts/verificar-mcp.mjs` y falla si alguno no responde.

En macOS o Linux, el equivalente es descargar el binario de Engram de
`github.com/Gentleman-Programming/engram/releases` y ejecutar:

```bash
npm install --prefix .tools/codegraph @astudioplus/codegraph-mcp@0.21.0
```

## Configuración

`opencode.json` declara los servidores dentro de `mcp.servers`. Los comandos
locales son envoltorios en Node para que funcionen igual en Windows, macOS y
Linux:

```json
{
  "mcp": {
    "servers": {
      "codegraph": { "type": "local", "command": ["node", "scripts/mcp-codegraph.mjs"] },
      "engram": { "type": "local", "command": ["node", "scripts/mcp-engram.mjs"] },
      "supabase": {
        "type": "remote",
        "url": "https://mcp.supabase.com/mcp?project_ref=…&read_only=true&features=…",
        "enabled": true
      }
    }
  }
}
```

- `scripts/mcp-codegraph.mjs` excluye `node_modules`, `.tools`, `dist` y `build`
  del índice, y apaga la telemetría del paquete (`CODEGRAPH_TELEMETRY=off`).
- `scripts/mcp-engram.mjs` fija `--project tuki` y el perfil `agent`, para que
  las memorias no se mezclen con otros repositorios del equipo.
- Supabase va con `read_only=true`: sirve para leer esquema, políticas y
  documentación, **no** para aplicar migraciones. Las migraciones se aplican
  desde el SQL Editor o con `supabase db push`.

## Autenticar Supabase

La primera vez hay que autorizar el servidor remoto:

```powershell
# Windows (CLI de la app)
& "$env:APPDATA\ai.opencode.desktop\cli\2.2.0-x64\opencode-cli.exe" mcp auth supabase

# macOS / Linux
opencode mcp auth supabase
```

El comando abre el navegador y espera el callback en `127.0.0.1`. Al terminar:

```powershell
& "$env:APPDATA\ai.opencode.desktop\cli\2.2.0-x64\opencode-cli.exe" mcp list
# ✓ supabase connected
```

Las herramientas MCP se cargan al iniciar la sesión. Si se autoriza a mitad de
una sesión, hay que abrir una nueva (o recargar la app) para ver
`tools.supabase.*` dentro de `execute`.

## Coste en contexto

Los dos servidores exponen 42 y 23 herramientas. Medidos con `tools/list`, sus
esquemas completos pesan 42 KB (~10.5k tokens) y 29 KB (~7.3k tokens). No viajan
completos en cada turno: OpenCode usa Code Mode
(`mcp.servers.*.codemode: true`) y el agente las descubre con `search()` dentro
de `execute`. Aun así, el catálogo reducido y las instrucciones de cada servidor
cuestan contexto; para tareas que no tocan código ni memoria, `pnpm mcp:ligero`
los apaga y `pnpm mcp:completo` los vuelve a encender.

`pnpm contexto` muestra el gasto real de la sesión y las salidas más grandes.
Ver `docs/herramientas/ahorro-contexto.md`.

## Verificación

```bash
pnpm mcp:verificar
```

Salida esperada:

```text
OK  codegraph: 42 herramientas
OK  engram: 23 herramientas
```

## Uso

### CodeGraph: preguntas estructurales

```text
codegraph_get_curated_context  "derivación de paleta y contraste WCAG"
codegraph_analyze_impact       archivo + línea del símbolo
codegraph_find_circular_deps   ciclos de importación
codegraph_find_related_tests   pruebas que cubren un archivo
codegraph_get_edit_context     contexto alrededor de una línea
```

Primera consulta de cada sesión: indexa el workspace y puede tardar unos
segundos. Después responde en milisegundos.

Ejemplo real: la primera consulta señaló un ciclo en
`componentes/restaurante/plantillas/tipos.ts`. El reporte mostraba el mismo
archivo duplicado por la normalización de rutas de Windows (relativa y absoluta),
pero al leer los imports se confirmó el ciclo real con
`PlantillaRestaurante.tsx`: el contrato importaba `EstilosComunes` del shell y el
shell importaba `PlantillaMenuProps` del contrato. Se corrigió moviendo
`EstilosComunes` al contrato compartido y reexportándolo.

### Engram: memoria del proyecto

```text
mem_context          historial reciente (inicio de sesión o tras compactar)
mem_search           "¿por qué usamos Kustomize?"
mem_save             decisiones, hallazgos y convenciones en el momento
mem_session_summary  cierre de sesión
```

Memorias iniciales del proyecto:

1. Arquitectura y alcance (módulos 1–3, sin IA local).
2. Gates de calidad y cadena de suministro.
3. Integración de CodeGraph y Engram.
4. Rebrand de Riki a Tuki.

## Privacidad y seguridad

- **CodeGraph** indexa el código en local. La telemetría del paquete está
  apagada en el envoltorio; si quieres comprobarlo, el flag es
  `CODEGRAPH_TELEMETRY=off`.
- **Engram** guarda en una base local del usuario (SQLite + FTS5), fuera del
  repositorio. `--project tuki` separa este proyecto del resto.
- Nunca guardes en Engram secretos, tokens, datos personales ni el contenido de
  `.env.local`. Guarda decisiones y su justificación.
- `.tools/` está en `.gitignore`: los binarios (~100 MB) no se versionan.

## Encaje en el diplomado

| Módulo | Uso |
| --- | --- |
| 1. Fundamentos | CodeGraph para entender el grafo de la SPA antes de contenedizarla. |
| 2. Kubernetes y plataforma | Engram conserva decisiones de despliegue, drift y rollback entre sesiones. |
| 3. DevSecOps | Telemetría apagada, binarios fuera de Git, revisión de licencias de las herramientas. |

## Problemas comunes

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `Falta …/.tools/engram/engram.exe` | No se ejecutó el instalador | `scripts/instalar-herramientas.ps1` |
| CodeGraph tarda la primera consulta | Está indexando | Esperar; las siguientes son rápidas |
| Engram responde de otro proyecto | Se arrancó sin `--project` | Usar `scripts/mcp-engram.mjs` |
| El agente no ve las herramientas | `opencode.json` no recargado | Reiniciar la sesión de OpenCode |
| `find_circular_deps` repite el mismo archivo | Normalización relativa/absoluta en Windows | Confirmar el ciclo leyendo los imports; el ciclo real se detecta igual |
