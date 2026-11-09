# TukiTuki — microservicios

> Esta rama contiene únicamente el monorepo de microservicios, en la raíz del
> repositorio. La aplicación anterior vive en `main` y no se publica aquí.

Migración del Tuki original a TukiTuki, una arquitectura de microservicios con tres
frontends independientes y backend propio sobre PostgreSQL.

## Estado

| Fase | Estado |
|---|---|
| F0. Preparación y convenciones | Rescate ejecutado: 7 locales, 61 platos, 5 reseñas y 70 imágenes |
| F1. Plataforma base | Completada, con CI de tipos, pruebas, build, e2e y Kustomize |
| F2. Identidad y roles | Backend y UI originales conectados |
| F3. Restaurantes, menú y medios | Catálogo real importado y 70 imágenes migradas a RustFS |
| F4. Pedidos y reseñas | Backend y UI originales conectados; 5 reseñas rescatadas |
| F5. Administración | `admin-service` y app con métricas, suspensión y auditoría |
| F6. Cierre de frontends | Tres apps; comensal y panel reutilizan la UI original |
| F7. Kubernetes, GitOps y observabilidad | K8s, HPA, PDB, NetworkPolicies, ApplicationSet y alertas; Loki y trazas pendientes |
| F8. Datos, corte y demo | Seeds, catálogo, reseñas y guion de demo listos; el stack legacy se conserva |

El detalle de lo hecho, lo parcial y lo pendiente está en
[`docs/estado-fases.md`](docs/estado-fases.md).

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/arquitectura.md`](docs/arquitectura.md) | Servicios, capas y decisiones de diseño |
| [`docs/api.md`](docs/api.md) | Rutas HTTP por servicio |
| [`docs/openapi.yaml`](docs/openapi.yaml) | Contrato OpenAPI inicial |
| [`docs/despliegue.md`](docs/despliegue.md) | Docker Compose, Kubernetes y ArgoCD |
| [`docs/demo.md`](docs/demo.md) | Guion y credenciales de la demo |
| [`docs/estado-fases.md`](docs/estado-fases.md) | Avance real contra el plan |

## Estructura

```
apps/       Frontends: comensal, panel del dueño y administración.
services/   Microservicios de negocio y el gateway de IA.
packages/   Código compartido: UI original, dominio y cliente HTTP.
  experiencia-tuki/  Páginas y componentes del Tuki original, adaptados a TukiTuki.
infra/      Docker, Kubernetes, ArgoCD y observabilidad.
db/         Semillas y datos rescatados de la versión anterior.
docs/       Arquitectura, convenciones y decisiones (ADR).
```

## Reutilización del frontend original

`apps/web-comensal` y `apps/panel-restaurante` montan la interfaz del Tuki
original desde `@tuki/experiencia`: Descubrir, ficha pública, carrito, pedidos,
reseñas, mi cuenta, QR y el panel completo del dueño (restaurante, menú,
pedidos, reseñas, apariencia y difusión). La capa de datos se reescribió sobre
`@tuki/api-cliente`; no queda ninguna llamada a Supabase.

## Arranque local

```bash
pnpm install
pnpm infra:up
pnpm dev:identidad
```

El servicio de identidad queda en `http://localhost:3001`.
La infraestructura levanta PostgreSQL, Redis, RustFS, Mailpit y Traefik.

## Reglas del repositorio

- Dominio en español, capa técnica en inglés: `pedidos.service.ts`.
- Archivos de máximo 200 líneas; componentes de máximo 150.
- Una responsabilidad por archivo.
- Nada de `fetch` dentro de componentes React.
- Cada servicio tiene su propia base de datos y su propio usuario de PostgreSQL.
- Ningún servicio consulta tablas de otro servicio.
- Commits en español con prefijo `feat`, `fix`, `docs` o `style`.
