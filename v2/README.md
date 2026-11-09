# Tuki v2 — microservicios

Migración del proyecto Tuki a una arquitectura de microservicios con tres
frontends independientes y backend propio sobre PostgreSQL.

## Estado

| Fase | Estado |
|---|---|
| F0. Preparación y convenciones | En curso |
| F1. Plataforma base | Completada |
| F2. Identidad y roles | Backend y UI originales conectados |
| F3. Restaurantes, menú y medios | Backend y panel original conectados |
| F4. Pedidos y reseñas | Backend y UI originales conectados |
| F5. Administración | `admin-service` y app con métricas, suspensión y auditoría |
| F6. Cierre de frontends | Tres apps; comensal y panel reutilizan la UI original |
| F7. Kubernetes, GitOps y observabilidad | K8s, ArgoCD, AI Gateway y observabilidad listos |
| F8. Datos, corte y demo | Seeds, e2e y guion de demo listos |

## Estructura

```
apps/       Frontends: comensal, panel del dueño y administración.
services/   Microservicios de negocio y el gateway de IA.
packages/   Código compartido: UI original, dominio y cliente HTTP.
  experiencia-tuki/  Páginas y componentes del Tuki anterior, adaptados a v2.
infra/      Docker, Kubernetes, ArgoCD y observabilidad.
db/         Semillas y datos rescatados de la versión anterior.
docs/       Arquitectura, convenciones y decisiones (ADR).
```

## Reutilización del frontend original

`apps/web-comensal` y `apps/panel-restaurante` montan la interfaz del Tuki
anterior desde `@tuki/experiencia`: Descubrir, ficha pública, carrito, pedidos,
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
