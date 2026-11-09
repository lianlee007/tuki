# restaurantes-service

Perfil del local, tema, cocinas, categorías, platillos, búsqueda, descubrir y
panel del dueño. Es el último servicio Node migrado a **arquitectura hexagonal**.

## Estructura

```text
src/
  dominio/        restaurante, tema, menú, propiedad, slug y errores.
                  No conoce Fastify ni PostgreSQL.
  puertos/        RestaurantesRepositorio, MenuRepositorio y PublicoRepositorio.
  aplicacion/     perfil, panel, menú, lectura pública y administración.
  adaptadores/    PostgreSQL y verificación JWT.
  entrada/http/   rutas, controladores y esquemas Zod.
  plugins/        autenticación y formato de errores.
  composicion.ts  raíz de composición.
```

## Decisión clave

La lectura pública tiene su propio puerto (`PublicoRepositorio`). El buscador,
la ficha y el menú del carrito no se mezclan con el CRUD del panel ni con la
administración. Cada adaptador PostgreSQL devuelve modelos de dominio, no filas
crudas.

```text
entrada/http -> aplicacion -> puertos <- adaptadores
                                 |
                              dominio
```

La regla de propiedad (`exigirPropietario`) vive en `dominio/propiedad.ts` y se
prueba sin HTTP.

## Pruebas

```bash
pnpm --filter restaurantes-service test
pnpm --filter restaurantes-service typecheck
```

`aplicacion/crear-restaurante.test.ts` y
`aplicacion/crear-platillo.test.ts` usan dobles de los puertos: validan el slug,
el dueño y el rechazo de un local ajeno sin base de datos.

## Contrato HTTP

Incluye las rutas públicas (`/v1/restaurantes`), el panel del dueño, el CRUD de
menú y las rutas de administración. No cambiaron durante el refactor.
