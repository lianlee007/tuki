# pedidos-service

Servicio de pedidos de TukiTuki. Es el **piloto de arquitectura hexagonal** del
monorepo y sirve de plantilla para los demás servicios Node.

## Estructura

```text
src/
  dominio/        Reglas puras: pedido, totales, WhatsApp, usuario y errores.
                  No conoce Fastify, PostgreSQL ni variables de entorno.
  puertos/        Interfaces que necesita el núcleo:
                  PedidosRepositorio y RestaurantesCliente.
  aplicacion/     Casos de uso: crear, consultar, cambiar estado y resumen.
                  Solo dependen de los puertos.
  adaptadores/    Implementaciones concretas:
                  postgres/ (repositorio y pool), http/ (restaurantes), auth/ (JWT).
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

`aplicacion` no importa `fastify`, `postgres` ni `fetch`. `dominio` no importa
ninguno de los dos. Cambiar PostgreSQL por otro almacén o el HTTP de
restaurantes por gRPC solo toca `adaptadores/`.

## Pruebas

```bash
pnpm --filter pedidos-service test
pnpm --filter pedidos-service typecheck
```

`aplicacion/crear-pedido.test.ts` usa dobles de `PedidosRepositorio` y
`RestaurantesCliente`: no necesita base de datos ni red.

## Contrato HTTP

Las rutas no cambiaron:

```text
POST   /v1/pedidos
GET    /v1/pedidos/mios
GET    /v1/pedidos/restaurante/:restauranteId
GET    /v1/pedidos/:id
PATCH  /v1/pedidos/:id/estado
GET    /v1/admin/pedidos/resumen
```
