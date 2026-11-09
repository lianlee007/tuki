# resenas-service

Servicio de reseñas de TukiTuki. Es el segundo servicio migrado a **arquitectura
hexagonal**, después de `pedidos-service`.

## Estructura

```text
src/
  dominio/        Reglas puras: reseña, promedio, usuario y errores.
                  No conoce Fastify, PostgreSQL ni variables de entorno.
  puertos/        ResenasRepositorio y RestaurantesCliente (interfaces).
  aplicacion/     Casos de uso: listar, crear, eliminar, votar, responder
                  y cambiar visibilidad. Solo dependen de los puertos.
  adaptadores/    postgres/ (repositorio y pool), http/ (restaurantes), auth/ (JWT).
  entrada/http/   Rutas, controlador y esquemas Zod de Fastify.
  plugins/        Autenticación y formato de errores.
  db/migrar.ts    Script de migraciones.
  app.ts          Raíz de composición: une casos de uso y adaptadores.
```

## Dirección de dependencias

```text
entrada/http -> aplicacion -> puertos <- adaptadores
                                 |
                              dominio
```

`aplicacion` no importa `fastify`, `postgres` ni `fetch`. Cambiar PostgreSQL por
otro almacén o el HTTP de restaurantes por gRPC solo toca `adaptadores/`.

## Pruebas

```bash
pnpm --filter resenas-service test
pnpm --filter resenas-service typecheck
```

`aplicacion/crear-resena.test.ts` y `aplicacion/eliminar-resena.test.ts` usan
dobles de `ResenasRepositorio` y `RestaurantesCliente`: no necesitan base de
datos ni red.

## Contrato HTTP

Las rutas no cambiaron:

```text
GET    /v1/resenas/restaurante/:restauranteId
GET    /v1/resenas/mios
POST   /v1/resenas
DELETE /v1/resenas/:id
POST   /v1/resenas/:id/util
DELETE /v1/resenas/:id/util
PUT    /v1/resenas/:id/respuesta
DELETE /v1/resenas/:id/respuesta
PATCH  /v1/resenas/:id/visible
```
