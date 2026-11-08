# Tuki v2 — microservicios

Migración del proyecto Tuki a una arquitectura de microservicios con tres
frontends independientes y backend propio sobre PostgreSQL.

## Estado

| Fase | Estado |
|---|---|
| F0. Preparación y convenciones | En curso |
| F1. Plataforma base | En curso |
| F2. Identidad y roles | En curso |
| F3. Restaurantes, menú y medios | Pendiente |
| F4. Pedidos y reseñas | Pendiente |
| F5. Administración | Pendiente |
| F6. Cierre de frontends | Pendiente |
| F7. Kubernetes, GitOps y observabilidad | Pendiente |
| F8. Datos, corte y demo | Pendiente |

## Estructura

```
apps/       Frontends: comensal, panel del dueño y administración.
services/   Microservicios de negocio y el gateway de IA.
packages/   Código compartido: UI, dominio, cliente HTTP y configuración.
infra/      Docker, Kubernetes, ArgoCD y observabilidad.
db/         Semillas y datos rescatados de la versión anterior.
docs/       Arquitectura, convenciones y decisiones (ADR).
```

## Arranque local

```bash
pnpm install
pnpm infra:up
pnpm dev:identidad
```

El servicio de identidad queda en `http://localhost:3001`.
La infraestructura levanta PostgreSQL, Redis, MinIO, Mailpit y Traefik.

## Reglas del repositorio

- Dominio en español, capa técnica en inglés: `pedidos.service.ts`.
- Archivos de máximo 200 líneas; componentes de máximo 150.
- Una responsabilidad por archivo.
- Nada de `fetch` dentro de componentes React.
- Cada servicio tiene su propia base de datos y su propio usuario de PostgreSQL.
- Ningún servicio consulta tablas de otro servicio.
- Commits en español con prefijo `feat`, `fix`, `docs` o `style`.
