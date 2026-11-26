<p align="center">
  <img src="docs/marca/tukituki-2026/marca-horizontal.svg" alt="TukiTuki" width="300" />
</p>

<h1 align="center">TukiTuki</h1>

<p align="center">
  Descubre restaurantes locales, pide por WhatsApp y deja tu reseña.
</p>

<p align="center">
  <a href="https://github.com/lianlee007/tuki/actions/workflows/tukituki-calidad.yml">
    <img src="https://github.com/lianlee007/tuki/actions/workflows/tukituki-calidad.yml/badge.svg?branch=main" alt="Calidad" />
  </a>
  <a href="https://github.com/lianlee007/tuki/actions/workflows/codeql.yml">
    <img src="https://github.com/lianlee007/tuki/actions/workflows/codeql.yml/badge.svg?branch=main" alt="CodeQL" />
  </a>
  <img src="https://img.shields.io/badge/Node.js-22-5FA04E?logo=nodedotjs&logoColor=white" alt="Node.js 22" />
  <img src="https://img.shields.io/badge/pnpm-12.14-F69220?logo=pnpm&logoColor=white" alt="pnpm 12.14" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/license-MIT-2F6FB0" alt="Licencia MIT" />
</p>

---

TukiTuki es una plataforma para restaurantes de Popayán. El comensal descubre
locales, consulta el menú, arma un pedido, lo cierra por WhatsApp y deja una
reseña. El dueño administra su menú, sus pedidos y sus reseñas. El
superadministrador modera locales y usuarios.

El proyecto es un monorepo de pnpm con **tres frontends**, **seis servicios
Node**, **dos servicios Python de IA**, una base PostgreSQL por servicio y un
gateway de IA local con RAG. La operación está contenerizada y también se puede
desplegar con Kubernetes, Kustomize y Argo CD.

> Si solo quieres ver la aplicación funcionando, ve a
> [Inicio rápido](#inicio-rápido). Si vas a desarrollar o desplegar, lee
> [Ejecución manual](#ejecución-manual) y [Kubernetes](#kubernetes-y-gitops).

## Contenido

- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Inicio rápido](#inicio-rápido)
- [URLs y credenciales demo](#urls-y-credenciales-demo)
- [Ejecución manual](#ejecución-manual)
- [IA local con Ollama](#ia-local-con-ollama)
- [Pruebas](#pruebas)
- [Kubernetes y GitOps](#kubernetes-y-gitops)
- [Observabilidad](#observabilidad)
- [Solución de problemas](#solución-de-problemas)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Documentación](#documentación)
- [Contribuir y licencia](#contribuir-y-licencia)

## Arquitectura

```text
web-comensal      panel-restaurante      admin-plataforma
      |                   |                     |
      +---------- API Gateway / Ingress --------+
                          |
   +--------+--------+----+----+--------+--------+
   |        |        |         |        |        |
identidad restaurantes pedidos resenas media admin-service
   |        |        |         |        |        |
  DB       DB       DB        DB       DB       DB

                    ai-gateway (RAG)   vision-service
                         |                   |
                      Ollama             YOLO11n-cls
```

- **Frontends:** React 19 + Vite. Comensal, panel y administración son
  aplicaciones separadas; comparten `@tuki/ui-kit`, `@tuki/api-cliente` y
  `@tuki/experiencia`.
- **Servicios Node:** Fastify 5 con arquitectura hexagonal
  (`entrada/http -> aplicacion -> puertos <- adaptadores`). Cada servicio tiene
  su base y su usuario de PostgreSQL. Ningún servicio consulta tablas ajenas.
- **IA:** `ai-gateway` es FastAPI + Ollama + RAG híbrido (BM25 +
  `nomic-embed-text`). `vision-service` es FastAPI + YOLO11n-cls y decide si una
  foto es comida.
- **Infraestructura:** Docker Compose, Kubernetes, Kustomize, Argo CD,
  Prometheus, Grafana, Tempo y OpenTelemetry.
- **Entrega:** GitHub Actions con typecheck, tests, build, E2E, Ruff, pytest,
  Kustomize, CodeQL, Trivy, SBOM y firma con Cosign.

## Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | 22 o superior | Frontends, servicios y scripts. |
| pnpm | 12.14 | Monorepo. |
| Docker Desktop | Compose v2 | Stack completo, PostgreSQL, RustFS, Grafana. |
| Python | 3.12 | Solo si ejecutas `ai-gateway` o `vision-service` fuera de Docker. |
| Ollama | Reciente | Modelo de chat y embeddings. |
| kubectl | 1.30+ | Kubernetes y Kustomize. |
| Argo CD | 3.5+ | GitOps, si usas el clúster. |

En Windows, Docker Desktop debe estar encendido y, si usas Kubernetes, con la
opción **Enable Kubernetes** activa.

## Inicio rápido

### Windows: un solo clic

1. Instala Node 22, pnpm, Docker Desktop y Ollama.
2. Descarga los modelos de IA:

   ```powershell
   ollama pull nomic-embed-text
   ollama create tuki-chef -f services/ai-gateway/Modelfile
   ```

3. Haz doble clic en **`Iniciar-TukiTuki.bat`**.
4. Espera a que la ventana muestre el resumen de credenciales.
5. Abre `http://localhost:8081`.

El `.bat` llama a `scripts/iniciar-todo.ps1`, que:

- enciende Docker Desktop si hace falta;
- levanta el stack principal y el de observabilidad;
- comprueba Ollama, `tuki-chef` y `nomic-embed-text`;
- calienta el chatbot y prueba la IA de visión;
- abre el túnel de Argo CD en `https://localhost:8085`;
- abre la app, Grafana, Prometheus y Argo en el navegador;
- imprime las URLs y las credenciales.

Es idempotente: si algo ya está arriba, lo reutiliza.

### Linux o macOS

```bash
corepack enable
pnpm install --frozen-lockfile
cp infra/docker/.env.example infra/docker/.env
docker compose -f infra/docker/docker-compose.yml up -d --build
pnpm infra:monitoring:up
```

Luego ejecuta las migraciones y los seeds de la
[ejecución manual](#ejecución-manual). Ollama debe correr en
`http://localhost:11434`.

## URLs y credenciales demo

| Servicio | URL | Credenciales |
|---|---|---|
| Comensal | `http://localhost:8081` | `cliente@tukituki.local` / `Demo12345` |
| Panel del restaurante | `http://localhost:8082` | `lian@gmail.com` / `123456` |
| Administración | `http://localhost:8083` | `admin@tukituki.local` / `Admin12345` |
| API Gateway | `http://localhost:8084` | — |
| Grafana | `http://localhost:3000` | `admin` / `admin` |
| Prometheus | `http://localhost:9090` | — |
| Argo CD | `https://localhost:8085` | `admin` / la clave del secreto de Argo |

La clave de Argo se obtiene con:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

Si el túnel no está abierto:

```bash
kubectl port-forward -n argocd svc/argocd-server 8085:443
```

## Ejecución manual

### 1. Dependencias

```bash
corepack enable
pnpm install --frozen-lockfile
```

### 2. Variables de entorno

```bash
cp infra/docker/.env.example infra/docker/.env
```

Revisa `infra/docker/.env` si cambias puertos, claves o URLs. El archivo no se
versiona. Para los servicios que corras fuera de Docker, usa su `.env` o
exporta las variables en la shell.

### 3. Infraestructura base

Para desarrollo local puedes levantar solo las dependencias:

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres redis rustfs mailpit traefik
```

Para el stack completo (servicios, frontends, IA y observabilidad):

```bash
docker compose -f infra/docker/docker-compose.yml up -d --build
pnpm infra:monitoring:up
```

### 4. Migraciones

Cada servicio es dueño de su base:

```bash
pnpm --filter identidad-service db:migrar
pnpm --filter restaurantes-service db:migrar
pnpm --filter media-service db:migrar
pnpm --filter pedidos-service db:migrar
pnpm --filter resenas-service db:migrar
pnpm --filter admin-service db:migrar
```

En Kubernetes las migraciones corren en un `initContainer`; si fallan, el pod
no arranca.

### 5. Seeds y superadmin

Los seeds son opcionales. Cargan cuentas demo y dos restaurantes de ejemplo:

```bash
psql "postgresql://tuki_identidad:tuki_identidad_dev@localhost:5432/tuki_identidad" \
  -f db/seeds/identidad-demo.sql

psql "postgresql://tuki_restaurantes:tuki_restaurantes_dev@localhost:5432/tuki_restaurantes" \
  -f db/seeds/restaurantes-demo.sql
```

Si no tienes `psql`, usa `docker exec -i tukituki-postgresdb` o revisa
[`db/seeds/README.md`](db/seeds/README.md).

El superadmin se crea con:

```bash
pnpm --filter identidad-service db:superadmin
```

Por defecto crea `admin@tukituki.local` con `Admin12345`. En producción define
`SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD` antes de ejecutar el comando.

### 6. Desarrollo con Vite

Con las dependencias arriba:

```bash
pnpm dev:all
```

| Aplicación | URL de desarrollo |
|---|---|
| Comensal | `http://localhost:5173` |
| Panel | `http://localhost:5174` |
| Administración | `http://localhost:5175` |

En desarrollo, los frontends leen `VITE_*`; en Docker leen `/config.js` al
arrancar. Cambiar una URL en `config.js` no exige reconstruir.

### 7. Datos de producción rescatados

El importador carga el catálogo histórico de forma idempotente:

```bash
docker compose -f infra/docker/docker-compose.yml \
  --profile importar run --rm importador
```

## IA local con Ollama

El gateway no usa Groq ni una API de pago. Usa Ollama en el equipo anfitrión:

```bash
ollama pull nomic-embed-text
ollama create tuki-chef -f services/ai-gateway/Modelfile
ollama list
```

En Docker, el gateway alcanza Ollama con
`AI_OLLAMA_URL=http://host.docker.internal:11434`. En Linux, si
`host.docker.internal` no resuelve, usa la IP del host o
`--add-host=host.docker.internal:host-gateway`.

Prueba el chat:

```bash
curl -s -X POST http://localhost:8084/api/v1/ai/recomendar \
  -H "Content-Type: application/json" \
  -d '{"mensaje":"¿Qué me recomiendas para almorzar?","historial":[]}'
```

La primera consulta después de reiniciar el gateway construye el índice RAG y
puede tardar varios segundos.

## Pruebas

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Las pruebas unitarias usan Vitest y dobles; no necesitan PostgreSQL. Playwright
intercepta las rutas de los servicios, así que tampoco necesita el stack
completo.

Servicios Python:

```bash
cd services/ai-gateway
pip install -r requirements-dev.txt
ruff check app tests
pytest -q

cd ../vision-service
pip install -r requirements-test.txt
pytest -q
```

Manifiestos:

```bash
kubectl kustomize infra/k8s/overlays/local > /dev/null
kubectl kustomize infra/k8s/overlays/production > /dev/null
```

## Kubernetes y GitOps

La base de Kubernetes está en `infra/k8s/base` y los overlays en
`infra/k8s/overlays`. Producción renderiza 56 objetos.

```bash
# Ver lo que se aplicaría, sin tocar el clúster
kubectl kustomize infra/k8s/overlays/local

# Aplicar el clúster local
kubectl apply -k infra/k8s/overlays/local

# Instalar Argo CD y registrar el repositorio
pnpm gitops:instalar

# El script lee GITHUB_TOKEN (o GH_TOKEN); el PAT necesita lectura del repo
$env:GITHUB_TOKEN = "github_pat_..."
pnpm gitops:credenciales
pnpm gitops:aplicar

# Estado
pnpm gitops:estado
kubectl get pods -n tukituki
```

La aplicación de Argo se llama `tukituki-local`. La sincronización es automática
con `prune` y `selfHeal`; el HPA es el dueño de `replicas`. Para ver la interfaz:

```bash
kubectl port-forward -n argocd svc/argocd-server 8085:443
```

No se aplican cambios con `kubectl` a mano en producción: el cambio va por Git.

## Observabilidad

- Prometheus: `http://localhost:9090`, raspa cada 30 segundos.
- Grafana: `http://localhost:3000`, tableros de aplicación, servicios/SLO e
  infraestructura.
- Tempo: trazas OTLP en `http://localhost:3200`.
- SLO: 99,5 % de disponibilidad en una hora y p95 menor a 500 ms en endpoints
  públicos. Las reglas están en
  `infra/observability/prometheusrule-servicios.yaml` y en el equivalente de
  Docker.

El gateway expone `ai_gateway_*` (peticiones, latencia, tokens, rate limit y
llamadas al modelo). Los servicios Node exponen `tuki_http_*`.

## Solución de problemas

| Síntoma | Causa probable | Acción |
|---|---|---|
| `docker compose` falla al arrancar | Docker Desktop apagado o puerto ocupado | Enciende Docker y revisa `docker compose ps`. |
| El frontend carga pero la API falla | `config.js` apunta a otra URL o CORS | Revisa `http://localhost:8084/healthz` y las variables `TUKI_*`. |
| El chat responde lento o falla | Ollama apagado, modelo faltante o índice vencido | `ollama list`, `curl localhost:11434/api/tags`, reinicia el gateway. |
| El pod no arranca | Migración o base no disponible | `kubectl logs` del `initContainer` y revisa la conexión. |
| Argo muestra `OutOfSync` | Cambio manual o imagen inexistente | Revisa el diff y vuelve a sincronizar. |
| La imagen no se firma | CVE crítico corregible o permisos de GHCR | Revisa Trivy y los permisos del paquete. |
| Grafana muestra `No data` | Target caído o regla vacía | Consulta Prometheus y la regla de grabación. |

Más detalle en el runbook del documento de la monografía y en
[`docs/privacidad.md`](docs/privacidad.md).

## Estructura del repositorio

```text
apps/                 Tres frontends Vite/React
services/             Seis servicios Node + ai-gateway + vision-service
packages/             api-cliente, auth-react, dominio, experiencia-tuki, ui-kit
db/                   Migraciones, seeds e importación
e2e/                  Playwright de los tres frontends
infra/                Docker, Kubernetes, Argo CD, observabilidad, OpenTofu
scripts/              Arranque, humo, carga y evidencias
docs/                 Arquitectura, convenciones, privacidad, monografía y marca
```

## Documentación

| Documento | Qué contiene |
|---|---|
| [`docs/arquitectura.md`](docs/arquitectura.md) | Decisiones y capas. |
| [`docs/convenciones.md`](docs/convenciones.md) | Nombres, carpetas y estilo. |
| [`docs/rag-local.md`](docs/rag-local.md) | RAG, prompt, parámetros y evaluación. |
| [`docs/privacidad.md`](docs/privacidad.md) | Datos, retención y riesgos. |
| [`docs/monografia/`](docs/monografia/) | Monografía final en Word y PDF. |
| [`docs/entrega/chat-voz/`](docs/entrega/chat-voz/) | Medición del chatbot y voz. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Ramas, commits, pruebas y PRs. |
| [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) | Licencias de terceros y AGPL de Ultralytics. |

## Contribuir y licencia

El código propio se distribuye bajo **MIT** (`LICENSE`). `vision-service` usa
Ultralytics YOLO11, que es **AGPL-3.0**; revisa
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) antes de distribuirlo.

Para contribuir, lee [`CONTRIBUTING.md`](CONTRIBUTING.md). `main` está
protegida con los checks de CI y los cambios entran por pull request.
