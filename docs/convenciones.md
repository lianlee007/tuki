# Convenciones de código y carpetas

## Idioma

Se usa **espanglish controlado**: el dominio va en español y la capa técnica en
inglés. Así el negocio se lee en el idioma del producto y la infraestructura se
reconoce por su sufijo técnico.

| Elemento | Ejemplo |
|---|---|
| Carpeta de dominio | `pedidos/`, `resenas/`, `restaurantes/` |
| Ruta HTTP | `pedidos.routes.ts` |
| Controlador | `pedidos.controller.ts` |
| Servicio de aplicación | `pedidos.service.ts` |
| Repositorio | `pedidos.repository.ts` |
| Esquema de validación | `pedido.schema.ts` |
| Tipos | `pedido.types.ts` |
| Prueba | `pedidos.service.test.ts` |
| Componente React | `SeccionMenu.tsx` |
| Hook | `useMenu.ts` |
| Cliente HTTP del frontend | `menu.api.ts` |

## Tamaño

- Máximo **200 líneas** por archivo.
- Componentes de UI: máximo **150 líneas**.
- Funciones: máximo **80 líneas**.
- Una responsabilidad por archivo; sin componentes o servicios “Dios”.
- Los archivos actuales que superen el límite se dividen al migrarlos.

## Capas

Los servicios Node usan arquitectura hexagonal. La dirección de dependencias es
siempre la misma:

```text
entrada/http -> aplicacion -> puertos <- adaptadores
                                  |
                               dominio
```

- `dominio`: reglas y tipos del servicio; no conoce Fastify ni SQL.
- `puertos`: interfaces de repositorio, almacenamiento y clientes HTTP.
- `aplicacion`: casos de uso; no importa `fastify`, `postgres` ni `fetch`.
- `adaptadores`: PostgreSQL, S3, JWT y clientes HTTP.
- `entrada/http`: rutas, controladores y esquemas Zod.
- `plugins`: autenticación y formato de errores de Fastify.
- `app.ts` y `composicion.ts`: composición e inyección de dependencias.

Los seis servicios Node ya están migrados. `restaurantes-service` fue el último
y usa `RestaurantesRepositorio`, `MenuRepositorio` y `PublicoRepositorio` como
puertos. El detalle está en [`arquitectura.md`](arquitectura.md).

## Frontend

- `features/<dominio>/` agrupa componentes, hooks y cliente HTTP.
- Los componentes no hacen `fetch`.
- `packages/ui-kit` no conoce reglas de negocio.
- `packages/dominio` no conoce React ni Fastify.
- `packages/api-cliente` es el único lugar que arma URLs y cabeceras.

## Nombres de contenedores e imágenes

La capa se reconoce por el nombre, sin abrir el `docker-compose.yml`:

| Capa | Patrón | Ejemplo |
|---|---|---|
| Servicio de negocio | `tukituki-<servicio>-service` | `tukituki-pedidos-service` |
| Frontend | `tukituki-web-<rol>` | `tukituki-web-panel` |
| Infraestructura | `tukituki-<pieza>` | `tukituki-postgres` |
| Imagen en GHCR | `ghcr.io/<owner>/tukituki-<nombre>` | `ghcr.io/lianlee007/tukituki-web-admin` |

Los frontends usan `web-` para agruparse en `docker ps` y distinguirse de los
servicios, que terminan en `-service`. Las carpetas de las apps conservan su
nombre de producto (`web-comensal`, `panel-restaurante`, `admin-plataforma`).

## Commits

Formato conventional commits en español:

```text
feat: agrega el servicio de identidad
fix: corrige la rotación del refresh token
docs: documenta los límites de los microservicios
style: divide el panel de menú en componentes pequeños
```

Cada fase se integra con `--no-ff` a la rama
`feat/migracion-microservicios-desarrollo`.
