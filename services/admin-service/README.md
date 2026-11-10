# admin-service

BFF de superadministración de TukiTuki. Es el cuarto servicio migrado a
**arquitectura hexagonal**.

## Estructura

```text
src/
  dominio/        tipos del panel, acciones de auditoría y errores.
                  No conoce Fastify, PostgreSQL ni HTTP.
  puertos/        ServiciosRemotos y AuditoriaRepositorio (interfaces).
  aplicacion/     panorama, listados, cambiar estado/rol y auditoría.
  adaptadores/    http/ (identidad, restaurantes, pedidos), postgres/ y auth/.
  entrada/http/   rutas, controlador y esquemas Zod.
  plugins/        Autenticación y formato de errores.
  db/migrar.ts    Script de migraciones.
  app.ts          Raíz de composición.
```

## Decisión clave

El BFF no habla directamente con PostgreSQL de otros servicios ni con sus
tablas. Su único acceso remoto es el puerto `ServiciosRemotos`; la auditoría
local vive detrás de `AuditoriaRepositorio`. Cambiar HTTP por gRPC solo toca
`adaptadores/http`.

```text
entrada/http -> aplicacion -> puertos <- adaptadores
                                 |
                              dominio
```

## Pruebas

```bash
pnpm --filter admin-service test
pnpm --filter admin-service typecheck
```

`aplicacion/cambiar-estado-restaurante.test.ts` y
`aplicacion/cambiar-rol-usuario.test.ts` verifican la auditoría con dobles, sin
base de datos ni servicios dependientes.

## Contrato HTTP

```text
GET   /v1/admin/panorama
GET   /v1/admin/restaurantes
PATCH /v1/admin/restaurantes/:id/estado
GET   /v1/admin/usuarios
PATCH /v1/admin/usuarios/:id/rol
GET   /v1/admin/auditoria
```
