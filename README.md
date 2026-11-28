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
| Ollama | Opcional | Solo si usas el Ollama del host; el stack lo trae en contenedor. |
| kubectl | 1.30+ | Kubernetes y Kustomize. |
| Argo CD | 3.5+ | GitOps, si usas el clúster. |

En Windows, Docker Desktop debe estar encendido y, si usas Kubernetes, con la
opción **Enable Kubernetes** activa.

## Inicio rápido

### Windows: un solo clic

1. Instala Node 22, pnpm y Docker Desktop.
2. Los modelos de IA se descargan solos con el stack (`ollama-init`). Si prefieres usar el Ollama del host, instálalo y ejecuta:

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
- carga las cuentas y los datos demo, y crea el superadmin;
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
pnpm infra:up
pnpm demo:sembrar
docker compose -f infra/docker/docker-compose.yml ps
```

`pnpm demo:sembrar` espera a PostgreSQL y carga las cuentas, los restaurantes y
las reseñas de demostración. Es idempotente, así que puedes repetirlo cuando
quieras. No hace falta instalar Ollama: el stack lo trae en un contenedor.

### Windows por terminal, paso a paso

Es el mismo recorrido que hace el `.bat`, sin atajos. En PowerShell:

```powershell
node -v                                  # 22 o superior
pnpm -v                                  # 12.14
docker --version                         # Docker Desktop encendido

pnpm install
Copy-Item infra/docker/.env.example infra/docker/.env
pnpm infra:up
pnpm demo:sembrar
docker compose -f infra/docker/docker-compose.yml ps
```

`pnpm infra:up` levanta el stack principal y el de observabilidad en un solo
paso; es el equivalente a `docker compose -f infra/docker/docker-compose.yml up -d`
seguido de `pnpm infra:monitoring:up`. La primera vez construye las imágenes.

En `docker compose ps` deben aparecer los 18 contenedores del stack principal en
ejecución —con `healthy` en `postgres` y `api-gateway`—, más `ollama-init` y
`ai-gateway-permisos`, que terminan solos, y los tres de observabilidad
(`prometheus`, `grafana` y `node-exporter`). Cuando estén arriba, las tres apps
ya responden en `http://localhost:8081`, `8082` y `8083` sin arrancar nada más.
Para detenerlo todo sin perder datos: `pnpm infra:down`.

## URLs y credenciales demo

| Servicio | URL | Credenciales |
|---|---|---|
| Comensal | `http://localhost:8081` | `cliente@tukituki.local` / `Demo12345` |
| Panel del restaurante | `http://localhost:8082` | `dueno1@tukituki.local` / `Demo12345` |
| Administración | `http://localhost:8083` | `admin@tukituki.local` / `Admin12345` |
| API Gateway | `http://localhost:8084` | — |
| Grafana | `http://localhost:3000` | `admin` / `admin` |
| Prometheus | `http://localhost:9090` | — |
| Argo CD | `https://localhost:8085` | `admin` / la clave del secreto de Argo |

Las cuentas demo salen de los seeds. La primera vez cárgalas con
`pnpm demo:sembrar` (el arranque de Windows ya lo hace). Ese comando también
crea el superadmin con `admin@tukituki.local` / `Admin12345`.

La clave de Argo se obtiene con:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

Si el túnel no está abierto:

```bash
kubectl port-forward -n argocd svc/argocd-server 8085:443
```

### Comprobación rápida

Con el stack arriba, estas tres llamadas confirman que la API y las cuentas
responden:

```bash
curl -s http://localhost:8084/salud
# ok

curl -s -X POST http://localhost:8084/v1/identidad/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dueno1@tukituki.local","password":"Demo12345"}'
# {"usuario":{...},"accessToken":"...","refreshToken":"...","refreshExpiraEn":...}

curl -s -X POST http://localhost:8084/api/v1/ai/recomendar \
  -H "Content-Type: application/json" \
  -d '{"mensaje":"¿Qué me recomiendas para almorzar?","historial":[]}'
```

Las dos primeras responden de inmediato. La de IA puede tardar hasta un minuto
la primera vez, mientras construye el índice RAG y carga `tuki-chef` en CPU.

## Ejecución manual

Los comandos van en bash. En PowerShell, `cp` es `Copy-Item` y el resto es
idéntico; la sección [Windows por terminal](#windows-por-terminal-paso-a-paso)
tiene la versión completa.

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
pnpm infra:up
```

Equivale a `docker compose -f infra/docker/docker-compose.yml up -d` más
`pnpm infra:monitoring:up`. Si acabas de cambiar código o imágenes, fuerza la
reconstrucción con `docker compose -f infra/docker/docker-compose.yml up -d --build`.

Comprueba que todo subió:

```bash
docker compose -f infra/docker/docker-compose.yml ps
```

### 4. Migraciones

Si usas `pnpm infra:up`, no hace falta ejecutarlas: cada contenedor las aplica
antes de arrancar. Estos comandos son para cuando corres los servicios fuera de
Docker. Cada servicio es dueño de su base:

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

Los seeds cargan las cuentas demo, dos restaurantes de ejemplo, sus platos —con
descripciones, ingredientes y alérgenos— y las reseñas del catálogo histórico
cuando está disponible. Se aplican con un solo comando:

```bash
pnpm demo:sembrar
```

El comando espera a que PostgreSQL esté listo, aplica los archivos de
[`db/seeds/`](db/seeds/README.md) y crea el superadmin
`admin@tukituki.local` / `Admin12345`. Es idempotente: puedes repetirlo sin
duplicar datos. En una base con datos históricos omite el seed de restaurantes
si los locales demo ya existen con otro identificador.

Si prefieres aplicarlos a mano y tienes `psql`:

```bash
psql "postgresql://tuki_identidad:tuki_identidad_dev@localhost:5432/tuki_identidad" \
  -f db/seeds/identidad-demo.sql

psql "postgresql://tuki_restaurantes:tuki_restaurantes_dev@localhost:5432/tuki_restaurantes" \
  -f db/seeds/restaurantes-demo.sql
```

Si no tienes `psql`, usa el contenedor. En PowerShell:

```powershell
Get-Content db/seeds/identidad-demo.sql -Raw |
  docker exec -i tukituki-postgresdb psql -U tuki_admin -d tuki_identidad

Get-Content db/seeds/restaurantes-demo.sql -Raw |
  docker exec -i tukituki-postgresdb psql -U tuki_admin -d tuki_restaurantes
```

En bash:

```bash
docker exec -i tukituki-postgresdb psql -U tuki_admin -d tuki_identidad \
  < db/seeds/identidad-demo.sql

docker exec -i tukituki-postgresdb psql -U tuki_admin -d tuki_restaurantes \
  < db/seeds/restaurantes-demo.sql
```

El superadmin se puede volver a crear aparte con:

```bash
pnpm --filter identidad-service db:superadmin
```

Por defecto usa `admin@tukituki.local` con `Admin12345`. En producción define
`SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD` antes de ejecutar el comando.

### 6. Desarrollo con Vite

Para trabajar en todos los paquetes a la vez (servicios y frontends):

```bash
pnpm dev:all
```

| Aplicación | URL de desarrollo |
|---|---|
| Comensal | `http://localhost:5173` |
| Panel | `http://localhost:5174` |
| Administración | `http://localhost:5175` |

`pnpm dev:all` arranca también los seis servicios, así que **exige que Docker no
esté publicando los puertos 3001–3006**: o levantas solo las dependencias
(`docker compose -f infra/docker/docker-compose.yml up -d postgres redis rustfs
mailpit traefik`) o bajas el stack antes (`pnpm infra:down`). Si el stack de
Docker está arriba y solo quieres tocar un frontend, arranca ese nada más —
`pnpm dev:comensal`, `pnpm dev:panel` o `pnpm dev:admin`— y consume los
servicios que ya sirven los contenedores.

En desarrollo, los frontends leen `VITE_*`; en Docker leen `/config.js` al
arrancar. Cambiar una URL en `config.js` no exige reconstruir.

### 7. Datos de producción rescatados

El importador carga el catálogo histórico de forma idempotente:

```bash
docker compose -f infra/docker/docker-compose.yml \
  --profile importar run --rm importador
```

## IA local con Ollama

El gateway no usa Groq ni una API de pago. El stack de Docker levanta **Ollama
como un contenedor** (`ollama`) y un job `ollama-init` que descarga los modelos
y crea `tuki-chef`:

```bash
docker compose -f infra/docker/docker-compose.yml up -d ollama ollama-init
```

El gateway lo alcanza por la red interna con `AI_OLLAMA_URL=http://ollama:11434`
y los modelos quedan en el volumen `ollama_data`. La primera vez tarda porque
descarga alrededor de 1,3 GB; después el job es idempotente.

Si prefieres el Ollama instalado en el host, define
`AI_OLLAMA_URL=http://host.docker.internal:11434` en `infra/docker/.env`,
levanta el stack y descarga los modelos allí:

```bash
ollama pull nomic-embed-text
ollama create tuki-chef -f services/ai-gateway/Modelfile
ollama list
```

Prueba el chat:

```bash
curl -s -X POST http://localhost:8084/api/v1/ai/recomendar \
  -H "Content-Type: application/json" \
  -d '{"mensaje":"¿Qué me recomiendas para almorzar?","historial":[]}'
```

La primera consulta después de reiniciar el gateway construye el índice RAG y
carga el modelo en CPU; puede tardar hasta un minuto. Las siguientes responden
en segundos.

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
| El frontend carga pero la API falla | `config.js` apunta a otra URL o CORS | Revisa `http://localhost:8084/salud` y las variables `TUKI_*`. |
| El chat responde lento o falla | Ollama apagado, modelo faltante o índice vencido | `docker exec tukituki-ollamabe ollama list`, `curl http://localhost:8000/healthz`, reinicia el gateway. |
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
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Ramas, commits, pruebas y PRs. |
| [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) | Licencias de terceros y AGPL de Ultralytics. |

## Contribuir y licencia

El código propio se distribuye bajo **MIT** (`LICENSE`). `vision-service` usa
Ultralytics YOLO11, que es **AGPL-3.0**; revisa
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) antes de distribuirlo.

Para contribuir, lee [`CONTRIBUTING.md`](CONTRIBUTING.md). `main` está
protegida con los checks de CI y los cambios entran por pull request.
