# Estructura del repositorio

Mapa para leer el proyecto sin adivinar. Si un archivo nuevo no encaja en
ninguna fila, la regla está al final.

## 1. Vista de un vistazo

```text
tuki/
├── src/                    Aplicación web (TypeScript + React)
├── public/                 Estáticos que se sirven sin procesar
├── tests/frontend/         Pruebas unitarias de la SPA (Vitest)
├── db/                     SQL aplicado a mano en Supabase
├── services/ai-gateway/    Servicio Python (FastAPI) que habla con Groq
├── deploy/                 Kubernetes, ArgoCD, políticas y scripts
├── docker/                 Configuración de Nginx
├── scripts/                Utilidades de desarrollo y verificación
├── docs/                   ADRs, seguridad, arquitectura y runbook
├── .github/                CI/CD, Dependabot y plantillas
├── .tools/, .opencode/     Herramientas del agente (no van a la imagen)
├── Skills/                 Habilidades del agente (no van a la imagen)
├── Dockerfile              Imagen de la SPA (Node → Nginx)
├── docker-compose.yml      Stack local: web + gateway
└── package.json            Dependencias y scripts del frontend
```

## 2. Por qué cada carpeta

| Carpeta | Responsabilidad | Qué **no** debe ir aquí |
| --- | --- | --- |
| `src/` | Todo el código que se ejecuta en el navegador | Scripts de build, configuración de Docker |
| `src/api/` | Clientes HTTP del navegador (Supabase, gateway) | Reglas de negocio complejas |
| `src/lib/` | Funciones puras reutilizables (color, slug, formato) | Llamadas a red |
| `src/paginas/` | Una página por ruta | Componentes reutilizables |
| `src/componentes/` | Componentes por funcionalidad | Estado global |
| `src/contexto/`, `src/store/` | Estado compartido (React Context y Zustand) | Datos persistentes |
| `src/tipos/` | Tipos e interfaces | Implementaciones |
| `tests/frontend/` | Pruebas de la SPA | Pruebas del gateway (están en `services/ai-gateway/tests`) |
| `db/` | Cambios de esquema y datos de Supabase | Migraciones automáticas (no hay runner) |
| `services/ai-gateway/` | Servicio que protege la clave de Groq, autentica y limita | Código del navegador |
| `deploy/` | Manifiestos, overlays, políticas y scripts de operación | Lógica de la aplicación |
| `docs/` | Decisiones y evidencia | Código ejecutable |
| `scripts/` | Automatización de desarrollo y verificación | Dependencias de producción |

## 3. Reglas de nombres

1. **Dominio en español, infraestructura en inglés.** `platillo`, `restaurante`,
   `pedido` son del negocio; `hooks`, `store`, `lib` son términos técnicos
   asentados. No se traduce `Dockerfile` ni `deploy`.
2. **Un nombre, un concepto.** `src/api` es el cliente del navegador;
   `services/ai-gateway` es el servicio del servidor. Nunca se abrevian a
   `servicios`/`services` para cosas distintas.
3. **Sufijos por tipo**: `.test.ts` para pruebas, `.tsx` solo si renderiza JSX,
   `Contexto*` para providers de React, `use*` para hooks.
4. **Carpetas en singular** cuando contienen un módulo (`src/store`) y en
   plural cuando agrupan varios (`src/componentes`).

## 4. Por qué hay Python en un proyecto TypeScript

La SPA no habla con Groq directamente. `services/ai-gateway` es un **servicio
aparte** que:

- guarda `GROQ_API_KEY` fuera del navegador;
- valida el JWT de Supabase y aplica cuotas por usuario o IP;
- reintenta, cambia de modelo y normaliza la respuesta;
- expone `/metrics` para Prometheus.

Es una frontera de confianza, no una mezcla accidental de lenguajes. El
detalle y las alternativas están en `docs/adr/0006-gateway-en-python.md`.

Consecuencia práctica: dos cadenas de herramientas. El frontend usa
`pnpm`; el gateway usa `pip`/`uv`. La CI los valida por separado y la imagen
Docker encapsula cada uno.

## 5. Qué no es código del producto

`.tools/`, `.opencode/`, `Skills/` y `opencode.json` son herramientas del
agente de IA. Están excluidas de la imagen (`.dockerignore`) y no forman parte
del entregable; se documentan solo para que nadie las confunda con la app.

## 6. Dónde va un archivo nuevo

| Si el archivo… | Va en |
| --- | --- |
| Renderiza interfaz | `src/componentes/` o `src/paginas/` |
| Llama a una API | `src/api/` |
| Es una función pura | `src/lib/` |
| Es un tipo compartido | `src/tipos/` |
| Es una prueba de la SPA | `tests/frontend/` |
| Cambia el esquema de datos | `db/` |
| Es del gateway | `services/ai-gateway/app/` (dominio, puertos, servicios o adaptadores) |
| Es un manifiesto o política | `deploy/` |
| Es una decisión de arquitectura | `docs/adr/` |
| Es una propuesta de producto | `docs/producto/` |
| Es una regla de marca o un activo del logo | `docs/marca/` |
| Automatiza algo del repo | `scripts/` |
