# Diagrama entidad-relación · TukiTuki

| Campo | Valor |
| --- | --- |
| Versión | 1.0 |
| Fecha | 2026-11-23 |
| Modelo | Físico y lógico de las bases PostgreSQL |
| Archivo editable | [`diagrama-entidad-relacion.drawio`](diagrama-entidad-relacion.drawio) · página `ER · Modelo global` |
| Fuentes | [`../services/*/db/migraciones`](../services), [`../infra/docker/postgres/init/01-databases.sql`](../infra/docker/postgres/init/01-databases.sql) |
| Relacionado | [`diagramas-c4.md`](diagramas-c4.md), [`vista-despliegue.md`](vista-despliegue.md) |

## 1. Qué muestra

El diagrama reúne las **15 tablas** de las **6 bases lógicas** de TukiTuki en una
sola página. Cada base pertenece a un microservicio y se dibuja dentro de su
propio límite punteado:

| Servicio | Base lógica | Tablas |
| --- | --- | --- |
| `identidad-service` | `tuki_identidad` | `usuarios`, `refresh_tokens`, `auditoria_identidad` |
| `media-service` | `tuki_media` | `media_assets` |
| `admin-service` | `tuki_admin` | `auditoria_admin` |
| `restaurantes-service` | `tuki_restaurantes` | `restaurantes`, `temas`, `categorias`, `platillos`, `tipos_cocina`, `restaurantes_cocinas` |
| `pedidos-service` | `tuki_pedidos` | `pedidos`, `pedido_items` |
| `resenas-service` | `tuki_resenas` | `resenas`, `resenas_utiles` |

En local las seis bases comparten la instancia de PostgreSQL; en producción se
pueden separar sin cambiar el código, solo la cadena de conexión.

## 2. Convenciones

| Marca | Significado |
| --- | --- |
| **PK** | Clave primaria |
| **FK** | Clave foránea física, declarada en la misma base |
| **U** | Índice único (`unique`) |
| **REF** | Referencia lógica a otra base; no es `FOREIGN KEY` |

- Línea **continua**: relación con clave foránea real dentro de una misma base.
- Línea **discontinua**: referencia lógica entre servicios.
- Extremo con **crow's foot**: lado *muchos*; la barra vertical marca el lado *uno*.
- El diagrama usa las formas nativas de draw.io (`shape=table`, `tableRow`,
  `partialRectangle`) y las flechas ER de la librería *Entity Relation*.

## 3. Relaciones físicas

| Desde | Hacia | Cardinalidad | Borrado |
| --- | --- | --- | --- |
| `usuarios.id` | `refresh_tokens.usuario_id` | 1 : N | `cascade` |
| `restaurantes.id` | `temas.restaurante_id` | 1 : 1 | `cascade` |
| `restaurantes.id` | `categorias.restaurante_id` | 1 : N | `cascade` |
| `restaurantes.id` | `platillos.restaurante_id` | 1 : N | `cascade` |
| `categorias.id` | `platillos.categoria_id` | 0..1 : N | `set null` |
| `restaurantes.id` | `restaurantes_cocinas.restaurante_id` | 1 : N | `cascade` |
| `tipos_cocina.id` | `restaurantes_cocinas.tipo_cocina_id` | 1 : N | `cascade` |
| `pedidos.id` | `pedido_items.pedido_id` | 1 : N | `cascade` |
| `resenas.id` | `resenas_utiles.resena_id` | 1 : N | `cascade` |

`restaurantes_cocinas` resuelve la relación **M : N** entre restaurantes y tipos
de cocina. Su clave primaria es compuesta y un índice parcial garantiza que cada
restaurante tenga como máximo una cocina principal.

## 4. Referencias lógicas entre servicios

No existen claves foráneas entre bases. Las relaciones que cruzan servicios se
dibujan con línea discontinua y se validan en la aplicación:

| Origen | Destino | Nota |
| --- | --- | --- |
| `restaurantes.dueno_id` | `identidad.usuarios.id` | Dueño del local |
| `pedidos.usuario_id` | `identidad.usuarios.id` | Comensal que ordena |
| `pedidos.restaurante_id` | `restaurantes.restaurantes.id` | Local que recibe el pedido |
| `resenas.usuario_id` | `identidad.usuarios.id` | Autor de la reseña |
| `resenas.restaurante_id` | `restaurantes.restaurantes.id` | Local calificado |
| `media_assets.usuario_id` | `identidad.usuarios.id` | Propietario del archivo |

Para no cruzar el diagrama, estas referencias se listan en la nota de la página:

- `pedido_items.platillo_id` → `restaurantes.platillos.id`
- `resenas.platillo_id` → `restaurantes.platillos.id`
- `resenas_utiles.usuario_id` → `identidad.usuarios.id`
- `auditoria_admin.actor_id` → `identidad.usuarios.id`
- `auditoria_identidad.usuario_id` → `usuarios.id` (misma base, sin FK)

## 5. Decisiones visibles

- **Una base por servicio.** El acoplamiento entre dominios es por API, no por
  claves foráneas repartidas en varias bases.
- **Copias deliberadas.** `pedidos` guarda `nombre_cliente`; `pedido_items` guarda
  `nombre` y `precio_unitario`; `resenas` guarda `nombre_cliente`. Así el
  historial no cambia si el usuario o el menú cambian después.
- **Calificación del local.** `resenas.calificacion` puntúa al restaurante;
  `platillo_id` es opcional y solo indica el plato mencionado.
- **Metadatos frente a objetos.** `media_assets` vive en PostgreSQL, pero el
  archivo vive en RustFS/S3; la columna `key` es única.
- **Auditoría append-only.** `auditoria_identidad` y `auditoria_admin` solo
  insertan; no tienen claves foráneas para no acoplar el registro histórico.
- **Sin tablas en IA.** `ai-gateway` construye su índice desde las APIs y
  `vision-service` carga modelos YOLO en disco; ninguno posee esquema relacional.

## 6. Cómo editarlo

Abrir el archivo con [draw.io desktop](https://www.drawio.com/) o
[diagrams.net](https://app.diagrams.net/). Las tablas se editan como formas
nativas: al arrastrar una fila se conserva el estilo, y las relaciones se
reconectan desde los puertos de cada fila. La página mide `2500 × 1940` para que
quepa completa sin recortar las notas.
