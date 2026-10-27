# Tuki

Constructor de sitios web para restaurantes con inteligencia artificial.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.83-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-AI%20Gateway-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

Tuki permite que un restaurante publique su menú digital, reciba pedidos por
WhatsApp y administre su operación desde un panel, sin conocimientos técnicos.
Sobre la misma base conviven dos capas: **Descubrir**, el buscador de platos
para comensales, y el **panel del dueño**, donde se edita la carta, el diseño,
los pedidos y las reseñas.

El proyecto es además el trabajo integrador del diplomado **CloudForge AI 5.0**,
acotado a los módulos 1–3: fundamentos cloud native, Kubernetes/GitOps/Platform
Engineering y DevSecOps.

---

## Contenido

- [Estado del proyecto](#estado-del-proyecto)
- [Funcionalidades](#funcionalidades)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Puesta en marcha](#puesta-en-marcha)
- [Configuración](#configuración)
- [Base de datos](#base-de-datos)
- [AI Gateway](#ai-gateway)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Scripts](#scripts)
- [Calidad y pruebas](#calidad-y-pruebas)
- [Despliegue](#despliegue)
- [Herramientas para agentes](#herramientas-para-agentes)
- [Documentación](#documentación)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## Estado del proyecto

La aplicación está operativa en local y en el clúster de demostración:

- SPA con buscador de platos, ficha pública, carrito y pedido por WhatsApp.
- Panel con información del restaurante, menú, pedidos, reseñas, apariencia y
  difusión (QR y enlaces).
- Reseñas con estrellas, comentario y foto. Toda reseña entra pendiente; el
  dueño la publica, la oculta o la responde.
- Cuenta del comensal con sus reseñas y su historial de pedidos.
- Pedidos guardados en Supabase además del mensaje de WhatsApp, con bandeja y
  cambio de estado para el restaurante.
- AI Gateway propio para que la clave de Groq nunca llegue al navegador.
- Empaquetado Docker, manifiestos de Kubernetes con Kustomize, GitOps con
  ArgoCD, observabilidad y cadena de suministro firmada.

Estado de la entrega de los módulos 1–3, evidencias y pendientes:
[docs/modulos-1-3.md](docs/modulos-1-3.md).

## Funcionalidades

### Descubrir

- Búsqueda por plato, restaurante o cocina, con filtros por precio y etiquetas
  (vegetariano, vegano, picante).
- Carriles de cocinas y restaurantes, con valoración y rango de precios.
- Carrito por restaurante que termina en un mensaje de WhatsApp listo para
  enviar.
- Diseño adaptable a móvil, escritorio y modo oscuro.

### Ficha del restaurante

- Portada con la identidad del local, horario, ubicación y contacto.
- Nueve plantillas de menú: moderna, carta, minimalista, grid, inmersiva,
  vitrina, mosaico, díptico y compacta.
- Menú por categorías con disponibilidad, etiquetas dietéticas y detalle del
  plato.
- Reseñas publicadas con promedio, distribución de 5 a 1, foto ampliable y
  respuesta del restaurante.
- Acciones para compartir la ficha y escribir una reseña.

### Cuenta del comensal

- Ruta `/mi-cuenta` con perfil, reseñas propias e historial de pedidos.
- Estado real de cada reseña: pendiente de moderación o publicada.
- Borrado de la propia reseña con confirmación.
- Pedidos en curso e historial, con detalle, total y enlace al menú.

### Panel del restaurante

- Edición de datos, horarios, redes y datos de contacto.
- Gestión del menú: creación, edición, disponibilidad, visibilidad y borrado.
- Pedidos: filtros por estado, ventas del día, detalle del cliente, enlace a su
  WhatsApp y avance de estado.
- Reseñas: pendientes, publicadas y todas; aprobar, ocultar, responder, editar
  la respuesta o quitarla.
- Diseño: colores, tipografías y plantilla, con vista previa en tiempo real.
- Difusión: enlace público, código QR y piezas para compartir.
- Asistente de IA para redactar descripciones y textos de marketing.

### Inteligencia artificial

- La SPA llama al AI Gateway (`POST /api/v1/ai/chat`); el navegador nunca ve la
  clave de Groq.
- El gateway valida el JWT de Supabase, aplica cuotas por IP y por cuenta,
  reintenta con backoff y hace fallback entre modelos.
- Expone logs JSON, métricas Prometheus y trazas OpenTelemetry opcionales.

### Seguridad

- Autenticación con Supabase Auth y roles leídos desde `public.users`.
- Row Level Security en todas las tablas de negocio.
- El correo y el teléfono de una reseña o un pedido no se exponen al público.
- El autor solo puede borrar su propia reseña; el dueño solo modera las de su
  restaurante.
- Secretos solo en `.env.local` o en el runtime del gateway; nunca en el
  bundle.

## Tecnologías

| Capa | Tecnologías |
| --- | --- |
| Interfaz | React 19, TypeScript 5.8, React Router 7, Framer Motion 11, Zustand 5, React Hook Form 7, Zod 4, Lucide |
| Estilos | Tailwind CSS (CDN) y sistema de tokens propio en `public/styles/apple-tokens.css` |
| Datos y auth | Supabase (PostgreSQL, Auth, RLS) |
| Imágenes | Cloudinary, con preset sin firmar y optimización `q_auto,f_auto` |
| IA | FastAPI, Groq, Prometheus, OpenTelemetry |
| Pruebas | Vitest, pytest, Ruff, ESLint, TypeScript |
| Plataforma | Docker, Nginx, Kubernetes, Kustomize, ArgoCD, Kyverno |
| Cadena de suministro | Hadolint, Trivy, Syft, Cosign, kubeconform, kube-linter, conftest |

## Requisitos

- Node.js 20 o superior.
- pnpm 9 o superior (recomendado).
- Python 3.11 o superior para el AI Gateway.
- Docker y Docker Compose para el stack completo.
- Cuentas de Supabase, Cloudinary y Groq.

## Puesta en marcha

### 1. Clonar e instalar

```bash
git clone <url-del-repositorio>
cd tuki
pnpm install
```

### 2. Configurar el entorno

```bash
cp .env.example .env.local
```

Completa las variables que se describen en [Configuración](#configuración).
`.env.local` está en `.gitignore` y no debe confirmarse.

### 3. Preparar la base de datos

Los scripts de `db/` se aplican en Supabase, en orden. En un proyecto nuevo:

1. `db/sql-restaurantes-popayan.sql` crea los restaurantes y platos de
   demostración.
2. `db/sql-resenas.sql` añade las columnas y políticas de reseñas.
3. `db/sql-cuenta-y-pedidos.sql` añade la cuenta del comensal, la tabla de
   pedidos y las claves foráneas.

En el proyecto de demostración ya están aplicados como migraciones. Revisa
[Base de datos](#base-de-datos) antes de ejecutarlos en producción.

### 4. Levantar el AI Gateway

```bash
cd services/ai-gateway
python -m venv .venv
.venv/Scripts/pip install --require-hashes -r requirements-dev.txt   # Windows
.venv/bin/pip install --require-hashes -r requirements-dev.txt       # Linux y macOS
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8001
```

En Linux y macOS el intérprete es `.venv/bin/python`.

### 5. Iniciar la aplicación

En otra terminal, desde la raíz:

```bash
pnpm dev
```

La SPA queda en `http://localhost:3000` y Vite redirige `/api` al gateway en
`http://localhost:8001`.

## Configuración

Variables de `.env.local`:

```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=

# AI Gateway
VITE_AI_GATEWAY_URL=/api
GROQ_API_KEY=
```

| Variable | Ámbito | Obligatoria | Uso |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Navegador | Sí | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Navegador | Sí | Clave publicable de Supabase |
| `VITE_CLOUDINARY_CLOUD_NAME` | Navegador | Sí | Cuenta de Cloudinary |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Navegador | Sí | Preset sin firmar para subir imágenes |
| `VITE_AI_GATEWAY_URL` | Navegador | No | Prefijo del gateway; por defecto `/api` |
| `GROQ_API_KEY` | Servidor | Sí para IA | Clave de Groq, solo en el gateway |
| `AI_AUTH_MODE` | Servidor | No | `disabled` en local, `supabase` en producción |
| `AI_RATE_LIMIT_*` | Servidor | No | Cuotas anónimas y autenticadas |
| `AI_GROQ_MODELS` | Servidor | No | Orden de fallback de modelos |

Las variables con prefijo `VITE_` son públicas por diseño: Vite las incrusta en
el bundle. `GROQ_API_KEY` no debe llevar ese prefijo ni aparecer en `dist/`.

### Credenciales de los servicios

**Supabase.** Crea el proyecto, entra en *Settings > API* y copia la URL y la
clave publicable.

**Cloudinary.** Copia el *Cloud Name* del dashboard y crea un upload preset sin
firmar. El preset se usa tanto para las imágenes del menú como para las fotos
de las reseñas.

**Groq.** Genera una API Key en la consola y guárdala solo en `GROQ_API_KEY`.

## Base de datos

| Archivo | Contenido |
| --- | --- |
| `db/sql-restaurantes-popayan.sql` | Datos de demostración: cinco restaurantes, cuentas, menús y temas |
| `db/sql-resenas.sql` | Reseñas: `usuario_id`, `foto_url`, `respuesta_dueno`, índices y políticas RLS |
| `db/sql-cuenta-y-pedidos.sql` | Pedidos con `usuario_id`, estados, políticas RLS y claves foráneas |

Reglas que aplican los scripts:

- RLS activo en todas las tablas de negocio.
- Una reseña nace con `aprobado = false` y solo el dueño la publica.
- El autor puede leer y borrar su propia reseña.
- Un pedido solo lo leen el comensal que lo hizo y el restaurante que lo recibe.
- Solo el restaurante cambia el estado de un pedido.
- Ninguna política permite leer correos o teléfonos desde el cliente fuera de su
  propio registro.

Las políticas se probaron con transacciones y `set local role`, y el detalle de
la verificación está en
[docs/producto/red-social-restaurantes.md](docs/producto/red-social-restaurantes.md).

## AI Gateway

`services/ai-gateway` es un servicio FastAPI con arquitectura hexagonal:
dominio, puertos y adaptadores. Concentra todo el acceso a Groq para que la SPA
no maneje secretos.

Responsabilidades:

- Validar el JWT de Supabase contra su JWKS.
- Aplicar cuotas por IP para visitantes y por cuenta para usuarios autenticados.
- Reintentar y hacer fallback entre modelos.
- Exponer logs estructurados, métricas y trazas.

La guía completa —autenticación, cuotas, Docker, Kubernetes y observabilidad—
está en [deploy/README.md](deploy/README.md). Las decisiones de diseño están en
[docs/adr/](docs/adr/).

## Estructura del proyecto

```text
tuki/
├── src/                        # SPA (TypeScript y React)
│   ├── api/                    # Cliente de datos del navegador
│   ├── componentes/
│   │   ├── autenticacion/      # Acceso y registro
│   │   ├── cuenta/             # Reseñas y pedidos del comensal
│   │   ├── descubrir/          # Buscador, filtros y carrito
│   │   ├── landing/            # Página para restaurantes
│   │   ├── panel/              # Panel del dueño
│   │   ├── restaurante/        # Ficha pública y plantillas
│   │   ├── rutas/              # Protección de rutas
│   │   └── sistema-diseno/     # Piezas base de la interfaz
│   ├── contexto/               # Autenticación y tema
│   ├── hooks/                  # Hooks reutilizables
│   ├── lib/                    # Reglas puras: reseñas, pedidos, color, formato
│   ├── paginas/                # Una página por ruta
│   ├── store/                  # Estado global con Zustand
│   ├── tipos/                  # Tipos y modelos
│   ├── App.tsx                 # Rutas y proveedores
│   ├── constantes.ts           # Variables de entorno y límites
│   └── index.tsx               # Punto de entrada
├── public/                     # Estáticos y tokens de estilo
├── tests/frontend/             # Pruebas de Vitest
├── db/                         # Scripts SQL
├── services/ai-gateway/        # FastAPI: auth, cuotas, Groq y métricas
├── deploy/                     # Docker, Kubernetes, ArgoCD y observabilidad
├── docs/                       # Producto, arquitectura, seguridad y runbook
├── scripts/                    # Verificación y utilidades
├── docker/                     # Configuración de Nginx
├── Dockerfile                  # Imagen de la SPA (Node y Nginx)
└── docker-compose.yml          # Stack local: web y AI Gateway
```

El mapa completo, con las reglas de nombres y la justificación de cada carpeta,
está en [docs/estructura.md](docs/estructura.md).

## Scripts

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo con recarga en caliente |
| `pnpm build` | Build de producción en `dist/` |
| `pnpm preview` | Sirve `dist/`; no incluye el proxy `/api` |
| `pnpm typecheck` | Verifica los tipos con `tsc --noEmit` |
| `pnpm lint` | ESLint sobre el frontend |
| `pnpm test` | Pruebas unitarias con Vitest |
| `pnpm verificar` | Puerta completa de los módulos 1–3 |
| `pnpm mcp:verificar` | Comprueba el handshake de CodeGraph y Engram |
| `pnpm mcp:estado` | Muestra el estado de los servidores MCP |
| `pnpm mcp:ligero` | Apaga los MCP para ahorrar contexto |
| `pnpm mcp:completo` | Vuelve a encender los MCP |
| `pnpm verificar:paletas` | Comprueba contraste y paletas del sistema de diseño |

Gateway:

```bash
cd services/ai-gateway
pytest -q
ruff check app tests
```

## Calidad y pruebas

`pnpm verificar` ejecuta la puerta completa: tipos, lint, pruebas y build del
frontend; lint y pruebas del gateway; validación de los manifiestos Kustomize,
del catálogo de Backstage y de las políticas. En la última ejecución aprobaron
los 11 pasos y las 67 pruebas del frontend.

| Control | Comando |
| --- | --- |
| Tipos | `pnpm typecheck` |
| Lint del frontend | `pnpm lint` |
| Pruebas del frontend | `pnpm test` |
| Pruebas del gateway | `pytest -q` en `services/ai-gateway` |
| Lint del gateway | `ruff check app tests` |
| Manifiestos | `bash deploy/scripts/validar-k8s.sh` |
| Secretos en el historial | gitleaks |
| Vulnerabilidades | `pnpm audit --prod` y `pip-audit` |
| Licencias | `node scripts/licencias.mjs licencias.json` |
| Cadena de suministro | `bash deploy/scripts/verificar-supply-chain.sh` |

## Despliegue

### Docker Compose

```bash
docker compose --env-file .env.local up -d --build
```

Publica la SPA en `http://localhost:8080` y el gateway en
`127.0.0.1:8001`. Ambas imágenes usan multi-etapa, usuario no root, sistema de
archivos de solo lectura, health checks y bases fijadas por digest.

### Kubernetes

Los manifiestos viven en `deploy/` y se organizan con Kustomize en overlays
local y de producción:

- Deployments con probes, límites y solicitudes de recursos.
- Ingress con `/api` hacia el gateway.
- HPA, PodDisruptionBudget, NetworkPolicy y Pod Security `restricted`.
- ServiceMonitors, alertas y dashboard de Grafana.
- ArgoCD con sincronización manual en local y automática en producción.

```bash
kubectl kustomize deploy/k8s/overlays/local > /dev/null
bash deploy/scripts/validar-k8s.sh
bash deploy/scripts/demo-plataforma.sh verificar
```

### Hosting estático

La SPA se puede publicar en Vercel, Netlify, Cloudflare Pages, S3 con
CloudFront o cualquier hosting de sitios estáticos. La IA requiere el AI
Gateway: configura un rewrite de `/api/*` hacia el servicio o define
`VITE_AI_GATEWAY_URL` con su URL pública y habilita `AI_CORS_ORIGINS` en el
gateway.

`pnpm preview` no incluye el proxy de Vite. Para probar la IA en local usa
`pnpm dev` o el stack de Compose.

La guía de despliegue, TLS, escalado, observabilidad y diagnóstico está en
[deploy/README.md](deploy/README.md). Los incidentes conocidos y su resolución
están en [docs/runbook.md](docs/runbook.md).

## Herramientas para agentes

El repositorio declara dos servidores MCP locales en `opencode.json`:

- **CodeGraph** indexa símbolos, llamadas e imports, y responde preguntas de
  arquitectura e impacto.
- **Engram** conserva decisiones y hallazgos entre sesiones, aislados por
  proyecto.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/instalar-herramientas.ps1
pnpm mcp:verificar
```

Guía de uso y criterios de privacidad:
[docs/herramientas/codegraph-y-engram.md](docs/herramientas/codegraph-y-engram.md).
Las convenciones para agentes están en [AGENTS.md](AGENTS.md).

## Documentación

| Documento | Contenido |
| --- | --- |
| [docs/modulos-1-3.md](docs/modulos-1-3.md) | Alcance, evidencias y cierre de los módulos 1–3 |
| [docs/auditoria-modulos-1-3.md](docs/auditoria-modulos-1-3.md) | Auditoría técnica de la entrega |
| [docs/estructura.md](docs/estructura.md) | Organización del código y reglas de nombres |
| [docs/producto/red-social-restaurantes.md](docs/producto/red-social-restaurantes.md) | Reseñas, cuenta del comensal y pedidos |
| [docs/marca/marca-tuki.md](docs/marca/marca-tuki.md) | Sistema de marca, logo y usos |
| [docs/security/](docs/security/) | Modelo de amenazas, hallazgos y registro de uso de IA |
| [docs/adr/](docs/adr/) | Decisiones de arquitectura |
| [deploy/README.md](deploy/README.md) | Despliegue, operación y observabilidad |
| [docs/runbook.md](docs/runbook.md) | Diagnóstico e incidentes |
| [docs/laboratorio/fallo-inducido.md](docs/laboratorio/fallo-inducido.md) | Práctica de diagnóstico |
| [catalog-info.yaml](catalog-info.yaml) | Catálogo de servicios para Backstage |

## Contribuir

1. Crea una rama con prefijo `feat/`, `fix/`, `docs/` o `style/`.
2. Escribe los commits en español con prefijo convencional
   (`feat:`, `fix:`, `docs:`).
3. Mantén el código y la documentación en español.
4. Ejecuta `pnpm verificar` antes de abrir el pull request.
5. Revisa la licencia de cualquier dependencia nueva con
   `node scripts/licencias.mjs`.
6. Registra el uso de IA en
   [docs/security/registro-uso-ia.md](docs/security/registro-uso-ia.md).

Las ramas se integran a `main` con `--no-ff`.

## Licencia

Proyecto privado de uso interno. Todos los derechos reservados.

© 2026 Tuki.
