<p align="center">
  <img src="docs/marca/tukituki-2026/marca-horizontal.svg" alt="TukiTuki" width="300" />
</p>

<h1 align="center">TukiTuki</h1>

<p align="center">
  La plataforma que conecta comensales con restaurantes locales: descubre, pide y reseña.
</p>

<p align="center">
  <a href="https://github.com/lianlee007/tuki/actions/workflows/tukituki-calidad.yml">
    <img src="https://github.com/lianlee007/tuki/actions/workflows/tukituki-calidad.yml/badge.svg?branch=main" alt="Calidad" />
  </a>
  <img src="https://img.shields.io/badge/Node.js-22-5FA04E?logo=nodedotjs&logoColor=white" alt="Node.js 22" />
  <img src="https://img.shields.io/badge/pnpm-12.14-F69220?logo=pnpm&logoColor=white" alt="pnpm 12.14" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
</p>

---

TukiTuki es un monorepo de microservicios para descubrir restaurantes, armar
pedidos y publicar reseñas. Tiene tres frontends independientes, un backend
propio sobre PostgreSQL y un gateway de IA.

Cada servicio es dueño de sus datos: tiene su propia base lógica, su propio
usuario de PostgreSQL y un contrato HTTP explícito. Ningún servicio consulta las
tablas de otro.

## Arquitectura

```text
web-comensal      panel-restaurante      admin-plataforma
      |                   |                     |
      +---------- Ingress / Traefik ------------+
                          |
   +--------+--------+----+----+--------+--------+
   |        |        |         |        |        |
identidad restaurantes pedidos resenas media admin-service
   |        |        |         |        |        |
  DB       DB       DB        DB       DB       DB

                        ai-gateway
                   RustFS · Redis · Mailpit
```

- **Frontends:** tres aplicaciones Vite/React que comparten `@tuki/ui-kit` y
  `@tuki/api-cliente`; comensal y panel reutilizan además `@tuki/experiencia`.
  La configuración de URLs se carga en tiempo de ejecución desde `/config.js`,
  así que no hace falta recompilar para cambiar de entorno.
- **Servicios Node:** Fastify 5 con arquitectura hexagonal (`dominio`,
  `puertos`, `aplicacion`, `adaptadores`, `entrada`). Los casos de uso se prueban
  con dobles, sin base de datos ni red.
- **Comunicación:** REST síncrono entre servicios. Todavía no hay bus de
  eventos; la auditoría y las notificaciones son síncronas.
- **Seguridad:** JWT emitido por `identidad-service`, validación de rol en el
  frontend y de nuevo en cada servicio con `exigirRol`.
- **Medios:** los archivos viven en RustFS (API compatible con S3); en la base
  solo se guardan los metadatos.
- **IA:** `ai-gateway` es un servicio FastAPI hexagonal que habla con Groq y
  expone métricas Prometheus.

## Aplicaciones y servicios

### Frontends

| Aplicación | Público | Desarrollo | Docker | Host local |
|---|---|---|---|---|
| `web-comensal` | Comensal | `5173` | `8081` | `tukituki.local` |
| `panel-restaurante` | Dueño del restaurante | `5174` | `8082` | `panel.tukituki.local` |
| `admin-plataforma` | Superadministrador | `5175` | `8083` | `admin.tukituki.local` |

### Microservicios

| Servicio | Responsabilidad | Puerto | Documentación |
|---|---|---|---|
| `identidad-service` | Cuentas, credenciales, roles y sesiones | `3001` | [README](services/identidad-service/README.md) |
| `restaurantes-service` | Locales, menú, cocinas, categorías y búsqueda | `3002` | [Código](services/restaurantes-service) |
| `media-service` | Subida y metadatos de imágenes | `3003` | [README](services/media-service/README.md) |
| `pedidos-service` | Pedidos, ítems, totales y estados | `3004` | [README](services/pedidos-service/README.md) |
| `resenas-service` | Reseñas, respuestas y votos de utilidad | `3005` | [README](services/resenas-service/README.md) |
| `admin-service` | BFF de superadministración y auditoría | `3006` | [README](services/admin-service/README.md) |
| `ai-gateway` | Gateway de IA con Groq y métricas | `8000` | [Código](services/ai-gateway) |
| `vision-service` | Revisor de fotos: ¿es comida? (Ultralytics) | `8002` | [README](services/vision-service/README.md) |

### Servicios de apoyo

| Pieza | Puertos | Uso |
|---|---|---|
| PostgreSQL 16 | `5432` | Una base y un usuario por servicio |
| Redis 7 | `6379` | Previsto para caché y límites de tasa compartidos |
| RustFS | `9000` API / `9001` consola | Almacenamiento S3 compatible |
| Mailpit | `8025` UI / `1025` SMTP | Correo de desarrollo |
| Traefik | `8088` entrada / `8089` dashboard | Proxy local por host |

## Stack

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript 5.9, Python 3.12 en `ai-gateway` |
| Runtime | Node.js 22 |
| Backend | Fastify 5, Zod, Postgres.js, JWT con `jose`, Argon2 |
| Frontend | React 19, Vite 6, React Router 7, Tailwind CSS, Zustand |
| Datos | PostgreSQL 16, Redis 7, RustFS / S3 |
| IA | FastAPI, Groq, Prometheus |
| Pruebas | Vitest, Playwright, Pytest y Ruff |
| Infraestructura | Docker Compose, Kubernetes, Kustomize, ArgoCD, GitHub Actions |

## Estructura del repositorio

```text
.
├── apps/                    Frontends independientes
│   ├── web-comensal/        Descubrir, ficha, carrito, pedidos y reseñas
│   ├── panel-restaurante/   Panel del dueño
│   └── admin-plataforma/    Panel del superadministrador
├── services/                Microservicios de negocio
│   ├── identidad-service/
│   ├── restaurantes-service/
│   ├── media-service/
│   ├── pedidos-service/
│   ├── resenas-service/
│   ├── admin-service/
│   └── ai-gateway/          FastAPI + Groq
├── packages/                Código compartido
│   ├── api-cliente/         URLs, cabeceras y llamadas HTTP
│   ├── auth-react/          Sesión, guards y contexto de usuario
│   ├── dominio/             Reglas puras compartidas
│   ├── experiencia-tuki/    UI heredada del Tuki original
│   └── ui-kit/              Componentes visuales
├── db/seeds/                Datos de demostración
├── e2e/                     Pruebas Playwright de los tres frontends
├── infra/                   Docker, Kubernetes, ArgoCD y observabilidad
├── scripts/                 Humo y carga
└── docs/                    Arquitectura, convenciones y marca
```

## Puesta en marcha

### Requisitos

- Node.js 22 o superior.
- pnpm 12.14 (`corepack enable`).
- Docker Engine o Docker Desktop con Compose v2.
- Python 3.12 solo si vas a ejecutar `ai-gateway` fuera de Docker.
- Chromium de Playwright para las pruebas E2E: `pnpm exec playwright install chromium`.

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar el entorno

```bash
cp infra/docker/.env.example infra/docker/.env
```

Ajusta las variables que necesites. El archivo `.env` no se versiona. Docker
Compose lee `infra/docker/.env`; los servicios que ejecutes en local leen su
propio `.env` o las variables exportadas en la shell. Para el gateway de IA,
revisa también `services/ai-gateway/.env.example`.

### 3. Levantar la infraestructura

Para desarrollo local, levanta solo las dependencias:

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres redis rustfs mailpit traefik
```

Para levantar el stack completo (servicios y frontends incluidos):

```bash
pnpm infra:up
```

Si es la primera vez y las imágenes no existen:

```bash
docker compose -f infra/docker/docker-compose.yml up -d --build
```

### 4. Migrar y cargar datos

Con PostgreSQL en marcha, aplica las migraciones de cada servicio:

```bash
pnpm --filter identidad-service db:migrar
pnpm --filter restaurantes-service db:migrar
pnpm --filter media-service db:migrar
pnpm --filter pedidos-service db:migrar
pnpm --filter resenas-service db:migrar
pnpm --filter admin-service db:migrar
```

Los seeds son opcionales. Cargan las cuentas demo y dos restaurantes de ejemplo
con sus categorías y platos:

```bash
psql "postgresql://tuki_identidad:tuki_identidad_dev@localhost:5432/tuki_identidad" \
  -f db/seeds/identidad-demo.sql

psql "postgresql://tuki_restaurantes:tuki_restaurantes_dev@localhost:5432/tuki_restaurantes" \
  -f db/seeds/restaurantes-demo.sql
```

Si no tienes `psql` instalado, puedes usar `docker exec -i tukituki-postgresdb` o
ejecutar los archivos desde el contenedor. El detalle está en
[`db/seeds/README.md`](db/seeds/README.md).

El superadmin inicial se crea con:

```bash
pnpm --filter identidad-service db:superadmin
```

Por defecto crea `admin@tukituki.local` con contraseña `Admin12345`. En
producción, define `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD` antes de ejecutar
el comando.

El panel de superadministración se abre en:

| Entorno | URL |
|---|---|
| Desarrollo | `http://localhost:5175` |
| Docker Compose | `http://localhost:8083` |
| Kubernetes | `https://admin.tukituki.local` |

También puedes entrar desde el buscador público: escribe `patatas321` y
aparecerá el acceso directo al panel. La URL del atajo se configura con
`VITE_ADMIN_PANEL_URL` en desarrollo o con la clave `adminPanel` de
`/config.js` en un despliegue.

### 5. Arrancar las aplicaciones

Si elegiste solo las dependencias:

```bash
pnpm dev:all
```

Los frontends quedan en `http://localhost:5173`, `http://localhost:5174` y
`http://localhost:5175`. Los servicios, en los puertos `3001` a `3006`.

Si elegiste el stack completo, abre `http://localhost:8081`,
`http://localhost:8082` y `http://localhost:8083`.

### Cuentas de demostración

| Cuenta | Rol | Contraseña |
|---|---|---|
| `cliente@tukituki.local` | Comensal | `Demo12345` |
| `dueno1@tukituki.local` | Dueño de Café Bolívar | `Demo12345` |
| `dueno2@tukituki.local` | Dueño de Pizzería Centenario | `Demo12345` |
| `admin@tukituki.local` | Superadministrador | `Admin12345` |

El seed de identidad también crea las cuentas `dueno3@tukituki.local` a
`dueno7@tukituki.local` con la contraseña `Demo12345`.

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev:all` | Arranca todos los servicios y frontends en modo desarrollo |
| `pnpm dev:<servicio>` | Arranca un servicio con recarga en caliente |
| `pnpm dev:comensal` | Arranca `web-comensal` en `5173` |
| `pnpm dev:panel` | Arranca `panel-restaurante` en `5174` |
| `pnpm dev:admin` | Arranca `admin-plataforma` en `5175` |
| `pnpm typecheck` | Verifica tipos en todo el monorepo |
| `pnpm test` | Ejecuta las pruebas unitarias |
| `pnpm test:e2e` | Ejecuta Playwright contra los tres frontends |
| `pnpm build` | Compila aplicaciones, servicios y paquetes |
| `pnpm infra:up` | Levanta el stack completo con Docker Compose |
| `pnpm infra:down` | Detiene el stack local |
| `pnpm infra:logs` | Sigue los logs de los contenedores |
| `node scripts/humo.mjs` | Prueba de humo contra el stack real |
| `k6 run scripts/carga.k6.js` | Prueba de carga con k6 |

## Calidad y CI

El workflow [`tukituki-calidad.yml`](.github/workflows/tukituki-calidad.yml) se
ejecuta en cada push a `main` y en cada pull request. Tiene cuatro trabajos:

1. **Tipos, pruebas y build:** `typecheck`, `test` y `build` de todo el monorepo.
2. **E2E:** levanta los tres frontends y ejecuta Playwright con las APIs simuladas.
3. **AI Gateway:** `ruff check` y `pytest` sobre el servicio Python.
4. **Manifiestos:** valida los overlays de Kustomize de local y producción.

Las pruebas E2E no necesitan PostgreSQL: cada spec intercepta las respuestas de
los servicios. Para ejecutarlas en local:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## Despliegue

Los manifiestos de Kubernetes viven en `infra/k8s` y se organizan con Kustomize:

```bash
kubectl apply -k infra/k8s/overlays/local
kubectl kustomize infra/k8s/overlays/production
```

- `infra/k8s/overlays/local` apunta a imágenes con tag `local`.
- `infra/k8s/overlays/production` usa `v2.0.0` y réplicas para producción.
- Los secretos se declaran en `infra/k8s/base/secret.example.yaml`.
- `infra/argocd/applicationset.yaml` define las aplicaciones de ArgoCD para la
  rama de desarrollo y para `main`.
- La configuración pública de los frontends se inyecta con un `ConfigMap`, sin
  recompilar las imágenes.

La observabilidad está en `infra/observability`: ServiceMonitor, alertas de
Prometheus y un dashboard de Grafana para el panorama de TukiTuki.

### Dokploy (host Docker único)

`infra/docker/docker-compose.production.yml` despliega el monorepo completo en
un host Docker: PostgreSQL, RustFS, los seis servicios Node, el gateway de IA,
un API Gateway con Nginx y los tres frontends.

1. Copia `infra/docker/.env.production.example` y completa los secretos.
2. Configura esas variables en el servicio de Dokploy.
3. Apunta el *Compose Path* a `infra/docker/docker-compose.production.yml`.

El compose publica:

| Servicio | URL local del host | URL pública con nip.io |
|---|---|---|
| Comensal | `http://<host>:8081` | `https://tukituki.<host>.nip.io` |
| Panel | `http://<host>:8082` | `https://tukipanel.<host>.nip.io` |
| Administración | `http://<host>:8083` | `https://tukiadmin.<host>.nip.io` |
| API | `http://<host>:8084` | `https://tukiapi.<host>.nip.io` |

`nip.io` resuelve cada subdominio al IP del host sin comprar ni configurar DNS,
y Dokploy emite el certificado Let's Encrypt. Para un dominio propio basta con
cambiar las cuatro URLs y crear los registros `A` correspondientes.

En Dokploy, los dominios se agregan desde **Domains** del servicio Compose
(servicios `web-comensal`, `panel-restaurante`, `admin-plataforma` y `api-gateway`,
puerto `80`). Después de agregarlos hay que actualizar `TUKI_API_URL`,
`TUKI_WEB_URL`, `TUKI_ADMIN_PANEL_URL` y `CORS_ORIGENES` en las variables de
entorno y redesplegar.

PostgreSQL, RustFS y la red interna no se exponen. Las migraciones se ejecutan
al arrancar cada servicio y las imágenes de los frontends reciben la URL del API
en tiempo de ejecución mediante `/config.js`.

El servicio `importador` aplica
[`db/importacion/importar-produccion.sql`](db/importacion/importar-produccion.sql)
de forma idempotente después de las migraciones. Ese archivo contiene los datos
rescatados del Tuki original: 7 restaurantes, 61 platos, 23 cocinas y 5 reseñas.
Las 70 imágenes se cargaron en RustFS y las URLs públicas apuntan al API Gateway.

## Convenciones

- Dominio en español y capa técnica en inglés: `pedidos.service.ts`.
- Máximo 200 líneas por archivo, 150 por componente y 80 por función.
- Una responsabilidad por archivo.
- Nada de `fetch` dentro de componentes React: todo pasa por `@tuki/api-cliente`.
- Cada servicio tiene su propia base de datos y su propio usuario.
- Ningún servicio consulta las tablas de otro.
- Commits en español con prefijo conventional: `feat`, `fix`, `docs`, `style`.

El detalle completo está en [`docs/convenciones.md`](docs/convenciones.md).

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/arquitectura.md`](docs/arquitectura.md) | Servicios, capas y decisiones de diseño |
| [`docs/convenciones.md`](docs/convenciones.md) | Idioma, tamaño de archivos, capas y commits |
| [`docs/marca/tukituki-2026/README.md`](docs/marca/tukituki-2026/README.md) | Identidad visual y archivos de marca |
| [`db/seeds/README.md`](db/seeds/README.md) | Datos y cuentas de demostración |
| [`services/identidad-service/README.md`](services/identidad-service/README.md) | Identidad, sesiones y superadmin |
| [`services/pedidos-service/README.md`](services/pedidos-service/README.md) | Pedidos y arquitectura hexagonal |
| [`services/resenas-service/README.md`](services/resenas-service/README.md) | Reseñas y moderación |
| [`services/media-service/README.md`](services/media-service/README.md) | Imágenes y almacenamiento S3 |
| [`services/admin-service/README.md`](services/admin-service/README.md) | Superadministración y auditoría |

## Estado y pendientes

La V2 cubre el flujo completo con tres frontends, seis servicios Node y el
gateway de IA. Están resueltos Docker Compose, los manifiestos de Kubernetes
con ArgoCD y la CI de tipos, pruebas, build, E2E y Kustomize.

Pendientes conocidos:

- Bus de eventos (NATS o RabbitMQ) para notificaciones y auditoría asíncronas.
- Límite de tasa de Fastify respaldado por Redis y no por memoria del proceso.
- Trazas distribuidas y agregación de logs con Loki.
- Evaluar SSR en el frontend de comensal si el SEO de las fichas pasa a ser
  obligatorio.
