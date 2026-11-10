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

```text
routes -> controller -> service -> repository -> PostgreSQL
```

- `routes`: declara la URL y el esquema de entrada.
- `controller`: traduce HTTP a llamadas del servicio; no contiene negocio.
- `service`: reglas de negocio y transacciones.
- `repository`: único lugar con SQL.
- `schema`: validación con Zod.
- `types`: contratos del dominio.

`pedidos-service`, `resenas-service`, `media-service`, `admin-service` e
`identidad-service` son la excepción: ya usan arquitectura hexagonal
(`dominio/`, `puertos/`, `aplicacion/`, `adaptadores/`, `entrada/`). Solo
`restaurantes-service` sigue el esquema por capas hasta que se migre. El detalle
está en [`arquitectura.md`](arquitectura.md).

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
