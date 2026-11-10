# Arquitectura de TukiTuki

## Contexto

TukiTuki tiene tres públicos y cada uno entra por una aplicación distinta:

| Público | Aplicación | Necesita |
|---|---|---|
| Comensal | `web-comensal` | Descubrir platos, ver restaurantes, pedir por WhatsApp y reseñar |
| Dueño | `panel-restaurante` | Administrar su restaurante, menú, tema, pedidos y reseñas |
| Superadmin | `admin-plataforma` | Gestionar locales, usuarios, moderación y métricas |

## Contenedores

```text
web-comensal     panel-restaurante     admin-plataforma
      |                   |                    |
      +---------- Ingress / proxy --------------+
                          |
   +----------+-----------+-----------+----------+----------+
   |          |           |           |          |          |
identidad  restaurantes  pedidos    resenas    media     admin
   |          |           |           |          |          |
  DB         DB          DB          DB         DB         DB

                         ai-gateway
                    RustFS · Redis (previsto)
```

## Frontends

Los tres frontends son aplicaciones Vite independientes. Comensal y panel
reutilizan la interfaz original de la versión anterior de Tuki a través de
`packages/experiencia-tuki`:

- **Comensal**: Descubrir, ficha pública con plantillas, carrito, pedidos,
  reseñas, mi cuenta, inspiración, QR y páginas legales.
- **Panel**: configuración del restaurante, menú, pedidos, reseñas, apariencia y
  difusión.
- **Administración**: aplicación propia con panorama, locales, usuarios y
  auditoría.

La capa de datos de la interfaz heredada vive en
`packages/experiencia-tuki/src/lib/api-tuki.ts`: traduce los modelos en
camelCase de los servicios al modelo en snake_case que esperan los componentes.
Tailwind y los tokens visuales (`tokens.css`, `apple-tokens.css`) también se
heredaron para conservar el diseño.

Cada frontend carga `/config.js` al arrancar. Ese archivo define las URLs de los
servicios en tiempo de ejecución: en local apunta a `localhost` y en Kubernetes
un `ConfigMap` lo reemplaza por el host del API, sin recompilar la imagen.

La separación no es solo de carpetas: cada app tiene su propio `index.html`,
`vite.config.ts`, `Dockerfile` y build. Además de los guards de React
(`RutaPanel` exige rol de dueño y `RutaProtegida roles={['superadmin']}` protege
la administración), los servicios vuelven a validar el rol con `exigirRol`; un
comensal no puede llamar a los endpoints del panel aunque conozca la URL.

## Límites de negocio

- **Identidad** es dueña de las cuentas, credenciales y roles. No conoce
  restaurantes ni pedidos.
- **Restaurantes** es dueño del local, su tema, sus cocinas, categorías,
  platillos y opciones. La búsqueda pública vive aquí porque su dato también
  vive aquí.
- **Pedidos** es dueño del pedido y de sus ítems. Guarda una copia del nombre,
  precio y restaurante al momento de comprar para no depender de otros
  servicios en el historial.
- **Reseñas** es dueño de la valoración, la respuesta del dueño y los votos de
  utilidad.
- **Medios** es dueño del archivo y de sus metadatos; el objeto vive en RustFS o
  S3, nunca en la base.
- **Administración** es el plano de control del superadmin. Agrega lecturas y
  ejecuta acciones contra los otros servicios, dejando auditoría.
- **AI Gateway** se conserva de la versión anterior y solo cambia la forma de
  validar el token.

## Estilo por servicio

No todo el monorepo usa el mismo estilo. Conviene decirlo sin ambigüedad:

### Servicios Node de negocio

`restaurantes-service` usa **arquitectura por capas**:

```text
ruta Fastify -> controlador -> servicio -> repositorio concreto -> PostgreSQL
```

- `*.routes.ts` declara la ruta y los guards de rol.
- `*.controller.ts` valida la entrada con Zod y traduce a HTTP.
- `*.service.ts` orquesta el caso de uso.
- `*.repository.ts` habla con PostgreSQL mediante `postgres.js`.
- `*.mapper.ts` traduce filas a camelCase y `*.types.ts` guarda los tipos.

Estos servicios importan el repositorio concreto (`import * as repo from
'./x.repository.js'`) y este importa `sql` directamente. **No tienen puertos,
interfaces de repositorio ni composición por inyección de dependencias**, así
que no son hexagonales en sentido estricto. Las reglas puras que sí existen
—por ejemplo `siguienteEstado` y el cálculo de totales— viven en
`packages/dominio` y se prueban sin base de datos.

### Pedidos, reseñas, medios, admin e identidad: pilotos hexagonales

`services/pedidos-service`, `services/resenas-service`,
`services/media-service`, `services/admin-service` y
`services/identidad-service` ya se migraron y sirven de plantilla para los
demás:

```text
dominio/        reglas puras y tipos del servicio, sin Fastify ni SQL
puertos/        interfaces de repositorio y de clientes HTTP
aplicacion/     casos de uso (crear, listar, responder, cambiar estado…)
adaptadores/    PostgreSQL, HTTP de restaurantes y verificación JWT
entrada/http/   rutas, controlador y esquemas Zod
plugins/        autenticación y formato de errores de Fastify
app.ts          composición: une casos de uso y adaptadores
```

En `pedidos-service` la aplicación solo conoce `PedidosRepositorio` y
`RestaurantesCliente`. En `resenas-service` solo conoce `ResenasRepositorio` y
`RestaurantesCliente`. En `media-service` solo conoce `MediaRepositorio` y
`AlmacenObjetos`. En `admin-service` solo conoce `ServiciosRemotos` y
`AuditoriaRepositorio`. En `identidad-service` solo conoce
`UsuariosRepositorio`, `AuditoriaRepositorio`, `HasherPassword` y
`TokensSesion`; PostgreSQL, Argon2 y JWT son adaptadores intercambiables.

Los casos de uso se prueban con dobles sin levantar base de datos:

- `pedidos-service/src/aplicacion/crear-pedido.test.ts`
- `resenas-service/src/aplicacion/crear-resena.test.ts`
- `resenas-service/src/aplicacion/eliminar-resena.test.ts`
- `media-service/src/aplicacion/subir-media.test.ts`
- `admin-service/src/aplicacion/cambiar-estado-restaurante.test.ts`
- `admin-service/src/aplicacion/cambiar-rol-usuario.test.ts`
- `identidad-service/src/aplicacion/registrar.test.ts`
- `identidad-service/src/aplicacion/iniciar-sesion.test.ts`

### AI Gateway

`services/ai-gateway` sí es **hexagonal**:

```text
entrada/        FastAPI: rutas, dependencias y middleware
servicios/      casos de uso
dominio/        modelos y errores sin FastAPI ni Groq
puertos/        Protocol con los contratos que necesita el núcleo
adaptadores/    Groq, memoria y Supabase
composicion.py  inyección de dependencias
```

### Frontend

`packages/experiencia-tuki` aplica la misma idea por módulo funcional
(`cuenta`, `menu`, `pedidos`, `resenas`):

```text
modulos/<modulo>/dominio/         reglas puras, sin React
modulos/<modulo>/aplicacion/      orquestación y estado
modulos/<modulo>/infraestructura/ API, localStorage, adaptadores
```

El carrito es el ejemplo más claro: `dominio/carrito.ts` no conoce React ni
`localStorage`; la aplicación lo orquesta y la infraestructura lo persiste.

### Deuda arquitectónica

`pedidos-service`, `resenas-service`, `media-service`, `admin-service` e
`identidad-service` ya están migrados y sirven de referencia. Queda un solo
servicio Node por hexagonalizar: `restaurantes-service`.

El refactor por servicio es:

1. Extraer `dominio/` con entidades y reglas puras.
2. Declarar `puertos/` con interfaces de repositorio y clientes.
3. Mover los casos de uso a `aplicacion/`.
4. Implementar `adaptadores/` PostgreSQL, HTTP y S3.
5. Crear una raíz de composición que inyecte las dependencias.
6. Probar los casos de uso con dobles, sin PostgreSQL.

Es un refactor de aproximadamente **1–2 días por servicio** y no cambia el
contrato HTTP. `restaurantes-service` es el último y el más grande: concentra
perfil, tema, cocinas, categorías, platillos, búsqueda y panel.

## Comunicación

- REST con OpenAPI para las consultas y las acciones síncronas.
- Ningún servicio lee la base de otro.
- Los datos que un servicio necesita de otro se guardan como copia histórica o
  se piden por API. `pedidos-service`, `resenas-service` y `admin-service` usan
  clientes HTTP (`clientes/*.cliente.ts`) para hablar con restaurantes,
  identidad y pedidos.
- Los eventos (NATS o RabbitMQ) están previstos, pero **hoy no hay bus**: las
  notificaciones y la auditoría son síncronas.
- El enrutamiento por host y prefijo lo hace el Ingress de Kubernetes o Traefik
  en Docker; no hay un API Gateway propio con reintentos e idempotencia.

## Escalabilidad

- Servicios sin estado, escalables con HPA.
- Una base lógica por servicio; se puede mover a otra instancia sin cambiar
  código.
- Redis está desplegado, pero el límite de tasa de Fastify sigue en memoria;
  conectarlo a un almacén compartido es una tarea pendiente.
- RustFS/S3 y CDN para imágenes.
- Paginación e índices en búsqueda y pedidos.
- Despliegue y reversión independientes con ArgoCD.

## Decisiones pendientes

- Hexagonalizar los seis servicios Node, empezando por `pedidos-service`.
- Gateway concreto en Kubernetes: Traefik o Kong.
- Bus de eventos: NATS JetStream o RabbitMQ.
- App de comensal con SSR si el SEO de las fichas resulta obligatorio.
