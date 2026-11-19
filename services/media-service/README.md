# media-service

Servicio de imágenes de TukiTuki. Es el tercer servicio migrado a **arquitectura
hexagonal**, después de `pedidos-service` y `resenas-service`.

## Estructura

```text
src/
  dominio/        Destinos, validación de archivos y regla de rol.
                  No conoce Fastify, PostgreSQL ni S3.
  puertos/        MediaRepositorio y AlmacenObjetos (interfaces).
  aplicacion/     Casos de uso: subir y listar mis archivos.
  adaptadores/    postgres/ (metadatos), s3/ (RustFS) y auth/ (JWT).
  entrada/http/   Rutas, controlador multipart y esquemas Zod.
  plugins/        Autenticación y formato de errores.
  db/migrar.ts    Script de migraciones.
  app.ts          Raíz de composición: une casos de uso y adaptadores.
```

## Decisión clave

El repositorio PostgreSQL **no construye URLs de RustFS**. Devuelve
`MediaRegistro` sin URL y el caso de uso añade `url` con `AlmacenObjetos`.
Así el almacenamiento se puede cambiar sin tocar la persistencia.

## Revisor de fotos

Las fotos de `platillos` pasan antes por `vision-service` (Ultralytics,
`comida-v1.pt`): si el clasificador responde que la imagen no es comida, la
subida se rechaza con `422 imagen_no_comida`. El resto de destinos no se
revisan.

La revisión **falla abierto**: si el servicio está caído o tarda más de
`VISION_TIMEOUT_MS`, la foto se guarda igual. Un fallo de infraestructura no
debe impedir que un dueño publique su menú.

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `VISION_URL` | `http://127.0.0.1:8002` | Base del servicio de visión |
| `VISION_TIMEOUT_MS` | `8000` | Corte de la consulta; al vencer, se deja pasar |

```text
entrada/http -> aplicacion -> puertos <- adaptadores
                                 |
                              dominio
```

## Pruebas

```bash
pnpm --filter media-service test
pnpm --filter media-service typecheck
```

`aplicacion/subir-media.test.ts` usa dobles de `MediaRepositorio` y
`AlmacenObjetos`: valida la regla de rol, la subida y la URL sin red ni S3.

## Contrato HTTP

```text
POST /v1/media/subir?destino=platillos|restaurantes|resenas
GET  /v1/media/mios
```
