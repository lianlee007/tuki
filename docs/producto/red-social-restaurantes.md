# Tuki como red social de restaurantes

Propuesta de producto y de interfaz para que Descubrir deje de ser solo un
buscador y se comporte como una red de restaurantes, platos y personas. No
cambia la promesa del panel: el dueño sigue publicando su menú y recibiendo
pedidos por WhatsApp. La capa social es la puerta de entrada y la razón para
volver.

> Estado: **fase A implementada en la SPA**. La ficha ya muestra reseñas, el
> comensal puede escribir una con foto (entra como pendiente), el dueño la
> modera y la responde desde el panel y la cabecera social permite compartir.
> La migración `db/sql-resenas.sql` añadió `usuario_id`, `foto_url`,
> `respuesta_dueno` y las políticas RLS, y está aplicada en Supabase. Las fotos
> usan el mismo Cloudinary sin firmar de los platillos; no hay bucket nuevo.
>
> La cuenta del comensal ya guarda **teléfono y dirección de entrega** en
> `public.users` (`db/sql-datos-envio.sql`). El registro los pide y ofrece
> completarlos más tarde; el carrito los reutiliza.

## 1. Lo que ya existe (y por eso la propuesta es barata)

| Pieza | Dónde está | Qué implica |
| --- | --- | --- |
| `valoraciones` con `calificacion`, `comentario`, `aprobado`, `visible`, `platillo_id` y `email_cliente` | `src/tipos/base-datos.ts` | Las reseñas ya se pueden guardar; falta la interfaz para leerlas, escribirlas y moderarlas. |
| `rating` y `rating_cantidad` calculados en SQL | `db/sql-descubrir.sql`, `db/sql-clientes.sql` | El promedio ya viaja en las tarjetas; hoy no se puede explicar de dónde sale. |
| `SeccionReportes.tsx` | `src/componentes/panel/` | Existe pero no está en la navegación: es el lugar natural para la bandeja de reseñas. |
| Pestañas del panel: `info`, `menu`, `tema`, `difusion` | `src/componentes/panel/BarraLateral.tsx` | Falta una quinta pestaña social. |
| Feed con búsqueda, cocinas, restaurantes y carrito | `src/paginas/PaginaDescubrir.tsx` | Es una superficie **Operate** muy bien resuelta; la capa social debe colgar de ella, no reemplazarla. |

Conclusión: la red social no empieza con un feed infinito. Empieza por hacer
visible lo que la base de datos ya sabe.

## 2. Principio de diseño

**La red social es la mesa, no el muro.**

```
buscar → confiar → guardar → pedir → contar
  |         |         |         |        |
 feed    reseñas   colección  carrito  reseña/foto
```

- La búsqueda sigue siendo la portada. No se tapa con un héroe ni con un feed.
- Cada elemento social tiene que terminar en una acción útil: ver el menú,
  guardar un plato, pedir o contar cómo estuvo.
- Un solo carril social por pantalla. Si hay que elegir entre «Lo que está
  pasando» y «Voces de la ciudad», gana el que acerca al plato.
- Nada de métricas vacías: si un contador no cambia una decisión, no se muestra.

## 3. Elementos a agregar

### Capa A — Confianza (P0)

| # | Elemento | Qué hace | Dónde vive | Datos que usa |
| --- | --- | --- | --- | --- |
| A1 | **Reseñas visibles en la ficha** | Muestra las reseñas aprobadas con estrellas, autor, plato y fecha. Sin ellas, el `rating` es un número sin historia. | `src/componentes/restaurante/PlantillaRestaurante.tsx`, después del menú y antes del pie. Nuevo `SeccionResenas` en `src/componentes/restaurante/`. | `valoraciones` (`visible`, `aprobado`), `perfiles`, `platillos`. |
| A2 | **Escribir reseña después del pedido** | El comensal califica de 1 a 5, elige el plato, escribe y adjunta una foto. Se guarda como no aprobada. | Éxito de `ModalCarrito` y `PanelCarrito`; también `?resena=1` en la ficha. Nuevo `FormularioResena`. | `valoraciones` + `usuario_id` (columna nueva) + `foto_url`. |
| A3 | **Cabecera social de la ficha** | Reúne nombre, cocina, ciudad, estrellas, número de reseñas, seguidores, **Guardar** y **Compartir**. Hoy la ficha solo tiene nombre y eslogan. | Cabecera de `PlantillaRestaurante` (una sola, compartida por las nueve plantillas). | `buscar_restaurantes` por slug o un `resumen_restaurante` nuevo. |
| A4 | **Bandeja de reseñas en el panel** | El dueño aprueba, oculta o responde. Sin moderación, abrir las reseñas es abrir la puerta al spam. | Nueva pestaña **Reseñas** en `BarraLateral` y `PanelControl`; revive `SeccionReportes` como `SeccionResenas`. | `valoraciones`, `respuesta_dueno` (columna nueva). |
| A5 | **Pedido compartido** | Al terminar el pedido, genera una tarjeta («Pedí en El Fogón») para WhatsApp o para copiar el enlace. Es prueba social sin pedir una cuenta nueva. | Éxito de `ModalCarrito` y `PanelCarrito`. | Carrito + restaurante; no requiere tabla nueva. |
| A6 | **Estrellas explicadas** | Componente `Estrellas` con promedio, cantidad y distribución (5→1). Solo se muestra si `rating_cantidad > 0`. | `src/componentes/sistema-diseno/Estrellas.tsx`; se usa en tarjetas, ficha y reseñas. | `rating`, `rating_cantidad`, conteos por estrella. |

### Capa B — Pertenencia (P1)

| # | Elemento | Qué hace | Dónde vive | Datos que usa |
| --- | --- | --- | --- | --- |
| B1 | **Perfil de comensal** | Da nombre y cara a quien reseña: avatar, ciudad, bio, cocinas favoritas, reseñas y colecciones públicas. Sin esto, las reseñas son anónimas. | Nueva ruta `/persona/:slug`; `src/paginas/PaginaPersona.tsx` + `src/componentes/persona/`. Enlace desde el autor de cada reseña. | `perfiles` (`id`, `slug`, `nombre`, `bio`, `ciudad`, `avatar_url`, `visibilidad`). |
| B2 | **Guardados y colecciones** | «Quiero probar», «Favoritos», «Para una cita». El corazón va sobre la foto del plato y en la cabecera del restaurante; la colección se elige en una hoja. | `TarjetaPlato`, `TarjetaRestaurante`, `ModalDetallePlatillo` y nueva ruta `/guardados`. | `guardados` (`usuario_id`, `platillo_id` o `restaurante_id`, `coleccion_id`). |
| B3 | **Seguir restaurantes y personas** | El botón **Seguir** en la ficha y en el perfil; una pestaña **Siguiendo** en Descubrir filtra el feed. El contador de seguidores aparece solo en restaurantes. | Cabecera social (A3), perfil (B1) y `PaginaDescubrir` (`?vista=siguiendo`). | `seguimientos` (`seguidor_id`, `seguido_id`, `tipo`). |
| B4 | **Reacciones de dominio** | En vez de un «me gusta» genérico: **Me antoja** y **Ya lo probé**. Se muestran en el detalle del plato y en la reseña. | `ModalDetallePlatillo`, `FormularioResena`. | `reacciones` (`usuario_id`, `platillo_id`, `tipo`). |
| B5 | **Historial de pedidos del comensal** | «Pediste esto» en la ficha del restaurante y en **Mi cuenta**. Convierte un pedido por WhatsApp en una relación que se puede repetir. | `/mi-cuenta` (pestaña **Mis pedidos**) y bandeja **Pedidos** del panel. | `pedidos` + `usuario_id` (columna nueva). |

### Capa C — Descubrimiento (P2)

| # | Elemento | Qué hace | Dónde vive | Datos que usa |
| --- | --- | --- | --- | --- |
| C1 | **Carril «Lo que está pasando»** | 3–6 tarjetas de reseñas recientes con foto, restaurantes nuevos y platos recién publicados. Un carril, no un feed infinito. | `PaginaDescubrir`, entre `CarrilCocinas` y `CarrilRestaurantes`. | Vista `actividad_publica` (reseñas aprobadas + altas de 14 días). |
| C2 | **Historias de restaurantes** | Una historia por día y por restaurante (plato del día, cocina, evento), visible 24 h. Se sube desde el panel. | Carril superior de `PaginaDescubrir`; subida en `SeccionDifusion`. | `historias` (`restaurante_id`, `media_url`, `expira_en`, `aprobada`). |
| C3 | **Mapa «Cerca de mí»** | Alterna lista/mapa en Descubrir; pines por restaurante y filtro por ciudad. Sin geolocalización exacta si el local no la autoriza. | `PaginaDescubrir` + `src/componentes/descubrir/Mapa.tsx`. | `latitud`/`longitud` en `restaurantes` (hoy solo hay dirección y ciudad). |
| C4 | **Voces de la ciudad** | Tres personas locales con su última reseña. Es editorial, no algorítmico: se curaduran a mano. | Carril en Descubrir o ruta `/personas`. | `perfiles` + `valoraciones` + una tabla `destacados`. |
| C5 | **Notificaciones** | Campana con «X respondió», «nuevo seguidor», «reseña aprobada». Requiere un job del servidor; no se hace en el cliente. | `BarraDescubrir` + `/notificaciones`. | `notificaciones` (`usuario_id`, `tipo`, `leida`, `payload`). |

### Mejoras visuales transversales

| Elemento | Qué resuelve | Dónde |
| --- | --- | --- |
| **`Avatar`** | Hoy no hay una pieza para personas. Avatar circular con iniciales sobre superficie cuando no hay foto (nunca color aleatorio). Tamaños 24/32/40/64. | `src/componentes/sistema-diseno/Avatar.tsx`. |
| **`TarjetaResena`** | Fija la forma de una reseña: estrellas, autor, plato, foto 4:3, fecha y una acción («Útil»). Sin sombra en reposo. | `src/componentes/restaurante/`. |
| **`CabeceraSocial`** | Evita que las nueve plantillas inventen nueve cabeceras distintas. Una sola composición, heredando la paleta del restaurante. | `src/componentes/restaurante/CabeceraSocial.tsx`. |
| **Ficha con foto protagonista** | La portada actual compite con el menú. La cabecera social debe dejar claro en 5 segundos: quién es, dónde está, cómo está valorado y qué se puede hacer. | Cabecera de `PlantillaRestaurante`. |
| **Estados vacíos con una acción** | «Aún no hay reseñas. Pide y cuéntanos cómo estuvo.» Un botón, no un párrafo. | `SeccionResenas`, `/guardados`, `/siguiendo`. |
| **Ritmo y densidad** | Un carril social, rejilla de 24, imágenes 4:3, sin gradientes ni sombras en reposo. El feed ya lo cumple; la capa nueva lo hereda. | `PaginaDescubrir` y componentes nuevos. |

## 4. Lo que no se propone (y por qué)

| Idea tentadora | Por qué no |
| --- | --- |
| Feed infinito con algoritmo | Convierte la portada en una máquina de retención y entierra el buscador. Tuki vive de que el comensal encuentre rápido qué comer. |
| Mensajes directos | Añade moderación, abuso y soporte. WhatsApp ya es el canal real del pedido; no se compite con él. |
| «Me gusta» genérico | No dice nada del dominio. «Me antoja» y «Ya lo probé» sí. |
| Historias en el lanzamiento | Necesitan volumen diario y moderación. Sin reseñas funcionando, son un carril vacío. |
| Contador de seguidores en comensales | Convierte la red en un concurso de popularidad y presiona a reseñar por vanidad. En restaurantes sí es útil. |
| Insignias de «verificado» | Sin un proceso de verificación real, es decoración. Primero la reseña aprobada. |
| Comentarios sobre platos antes de moderar | Duplica la superficie de spam. La reseña con compra verificada es la unidad mínima. |

## 5. Modelo de datos mínimo (propuesta)

Las filas marcadas como **Aplicado** ya están en la base; el resto queda para
las migraciones de las fases B y C.

| Tabla | Columnas clave | Regla de acceso |
| --- | --- | --- |
| `perfiles` | `id` (= `auth.uid`), `slug`, `nombre`, `bio`, `ciudad`, `avatar_url`, `visibilidad` | Lectura pública solo de campos públicos; escritura del propio perfil. |
| `guardados` | `usuario_id`, `platillo_id`, `restaurante_id`, `coleccion_id`, `created_at` | Solo el dueño lee y escribe; las colecciones públicas se leen por enlace. |
| `seguimientos` | `seguidor_id`, `seguido_id`, `tipo`, `created_at` | El seguidor crea y borra; el conteo es público. |
| `reacciones` | `usuario_id`, `platillo_id`, `tipo`, `created_at` | Única por usuario/plato/tipo; conteo público. |
| `valoraciones` | + `usuario_id`, `foto_url`, `respuesta_dueno` | Insertar la propia; leer las aprobadas o las propias; el dueño responde y modera. |
| `pedidos` | `usuario_id`, `restaurante_id`, `total`, `estado`, `created_at` | **Aplicado:** el comensal inserta y lee los suyos; el restaurante lee los de su local y mueve el estado. |
| `users` | + `telefono`, `direccion`, `barrio`, `referencias`, `datos_envio_*` | **Aplicado:** cada cuenta lee y edita solo su propia fila. |

Reglas transversales: RLS activo en todas, `security definer` solo en las
funciones de conteo, y ninguna política que permita leer correos o teléfonos
desde el cliente.

## 6. Plan de entrega

| Fase | Alcance | Criterio de aceptación |
| --- | --- | --- |
| **A. Confianza** | A1–A6 | Un comensal califica un plato con estrellas, comentario y foto; el dueño la aprueba y la responde; el promedio y el conteo cambian en la ficha y en el feed; la ficha se ve bien a 360 px y no salta al cargar. |
| **B. Pertenencia** | B1–B4 | Guardar un plato sobrevive al recargar; el perfil muestra reseñas y colecciones; seguir un restaurante cambia la pestaña Siguiendo; las reacciones no se pueden duplicar. |
| **C. Descubrimiento** | C1–C5 | El carril de actividad no desplaza al buscador; el mapa no muestra direcciones exactas sin permiso; las notificaciones se generan en el servidor. |

Cada fase entra con su migración, sus pruebas de RLS y su registro en
`docs/security/registro-uso-ia.md` si se asistió con IA.

## 7. Cómo defenderlo ante el jurado

1. «La red social no es un feed infinito: es la mesa. Descubrir sigue siendo
   el buscador; lo social aparece cuando el comensal ya encontró un plato.»
2. «La base de datos ya tenía valoraciones con comentario y aprobación, y el
   promedio ya se calculaba. El trabajo fue hacerlo visible y moderable.»
3. «El dueño no pierde el control: toda reseña entra como no aprobada y se
   responde desde el panel.»
4. «La privacidad está en las políticas: un comensal no puede leer correos ni
   teléfonos; una colección privada no se indexa.»
5. «Cada elemento social termina en una acción del negocio: ver el menú,
   guardar, pedir o volver.»

Métricas para la sustentación: reseñas por pedido, platos guardados por
usuario, restaurantes seguidos, retorno a la ficha en 30 días y tiempo hasta el
primer plato. Ninguna se inventa: se instrumentan antes de presumirlas.

## 8. Dónde va cada archivo nuevo

Sigue las reglas de `docs/estructura.md`:

- Páginas: `src/paginas/` (`PaginaPersona.tsx`, `PaginaGuardados.tsx`).
- Componentes de dominio: `src/componentes/restaurante/` y
  `src/componentes/persona/`.
- Piezas del sistema de diseño: `src/componentes/sistema-diseno/` (`Avatar`,
  `Estrellas`).
- Clientes HTTP: `src/api/` (`apiResenas.ts`, `apiSocial.ts`).
- Migraciones y RPC: `db/`.
- Decisiones: `docs/adr/` (una por la capa social y otra por la moderación).

## 9. Estado de la fase A (2026-10-27)

**Implementado**

- `Estrellas` y `Avatar` como piezas del sistema de diseño.
- `useResenas` + `apiResenas`: una sola consulta por ficha, filtro público y
  resumen del local.
- Sección pública `ResenasPublicas`: promedio, número de reseñas, lista,
  estados vacío/error/carga y «ver todas».
- `FormularioResena`: estrellas, plato, nombre, comentario, foto opcional,
  validación, estado de éxito y aviso de que queda pendiente de aprobación. La
  foto se comprime en el navegador y se sube a Cloudinary con el preset sin
  firmar del proyecto (máximo 8 MB; JPG, PNG o WebP).
- `ResenasPublicas`: promedio, distribución 5→1, lista con foto ampliable,
  respuesta del restaurante y estados vacío/error/carga.
- Cabecera social de la ficha: promedio, número de reseñas, **Escribir reseña**
  y **Compartir** (hoja nativa o portapapeles).
- Aviso posterior al pedido: «Pedido enviado. ¿Nos cuentas cómo estuvo?».
- Pestaña **Reseñas** en el panel: pendientes, publicadas, todas, aprobar,
  ocultar, responder y quitar la respuesta. La reseña nunca se borra.
- Migración `db/sql-resenas.sql` **aplicada** el 2026-10-27 como
  `resenas_fase_a` (versión `20261027220739`): columnas `usuario_id`,
  `foto_url`, `respuesta_dueno`, índices únicos y tres políticas RLS.
- Persistencia verificada con el MCP en una transacción con `set local role`:
  el autor inserta y ve su reseña pendiente; `anon` no la ve; el dueño la
  aprueba; `anon` la ve publicada. La transacción se revirtió, así que no dejó
  filas de prueba.
- 21 pruebas nuevas de las reglas de reseña y de las fotos (57 en total).

**Pendiente para cerrar la fase A en producción**

- Editar la propia reseña (el índice único ya bloquea duplicados y hoy se
  muestra un aviso).
- Notificaciones de «reseña aprobada» y «nueva reseña» (fase C).

## 10. Cuenta del comensal y pedidos (2026-10-27)

**Implementado**

- Ruta `/mi-cuenta`, protegida para cualquier cuenta con sesión. Cabecera de
  perfil con nombre, correo, rol y fecha de alta; aviso de qué se publica y qué
  no.
- Pestaña **Mis reseñas**: estado real (pendiente o publicada), foto, respuesta
  del restaurante, enlace a la ficha y borrado propio con confirmación en dos
  pasos.
- Pestaña **Mis pedidos**: pedidos en curso e historial, con código corto,
  estado, detalle, total y enlace al menú del restaurante.
- Menú de cuenta en `BarraDescubrir` (avatar → Mi cuenta, Mi panel, Cerrar
  sesión) y avatar de acceso a la cuenta en la barra de la ficha pública.
- La ficha pública añade una píldora **Reseñas** a la barra de categorías, que
  ahora se muestra aunque el local no tenga platos publicados.
- Al enviar un pedido por WhatsApp se guarda una copia en `pedidos` cuando hay
  sesión. Si el guardado falla, el pedido sigue su curso y no se bloquea.
- Pestaña **Pedidos** en el panel: por confirmar, en curso, cerrados y todos;
  ventas de hoy; detalle del pedido, teléfono con enlace a WhatsApp y avance de
  estado (confirmar → en camino → entregado) o cancelación.

**Base de datos**

- Migración `cuenta_y_pedidos` aplicada el 2026-10-27 con el MCP:
  `pedidos.usuario_id` con `default auth.uid()`, índices por restaurante y por
  usuario, restricción de estados y tres políticas RLS (alta del comensal,
  lectura del comensal o del dueño, edición solo del dueño). La política
  `valoraciones_borrado_propio` deja al autor borrar su propia reseña.
- Migración `resenas_pedidos_fk` aplicada el 2026-10-27: claves foráneas de
  `valoraciones` y `pedidos` hacia `restaurantes` (y de `valoraciones` hacia
  `platillos`). Sin ellas PostgREST no resolvía la consulta anidada que usa
  «Mi cuenta» para mostrar el nombre del restaurante.
- Verificado en una transacción con `set local role` y rollback: el comensal
  ve su pedido, otro comensal no, el dueño lo ve y lo actualiza, y el comensal
  no puede editar. También se comprobó que el autor borra su reseña y que otro
  usuario no puede borrarla. La tabla quedó sin filas de prueba.
- Prueba de extremo a extremo en la SPA: un comensal escribió una reseña con
  foto desde la ficha (subida real a Cloudinary), el dueño la publicó y la
  respondió en el panel, la ficha mostró promedio, distribución 5→1, foto y
  respuesta, y el comensal borró su reseña desde «Mi cuenta». El pedido de
  prueba se guardó, apareció en «Mis pedidos» y en la bandeja del panel, y el
  dueño lo pasó a *confirmado*. Las filas de prueba se borraron al terminar.
- El correo y el teléfono de `pedidos` no se pueden leer con la clave anónima.

**Pendiente**

- Aviso al comensal cuando el restaurante cambia el estado (fase C,
  notificaciones).
- «Repetir pedido» con el mismo carrito.

## 11. Datos de envío de la cuenta (2026-10-27)

**Implementado**

- El registro de comensal tiene un segundo paso, **Datos de envío**, con
  teléfono, dirección, barrio y referencias. El botón principal crea la cuenta y
  guarda los datos; la salida **Ahora no, crear mi cuenta sin dirección** crea
  la cuenta y deja constancia de que se completarán después.
- Los datos viajan en el metadata del registro para que funcionen también
  cuando la confirmación por correo deja la cuenta sin sesión.
- Pestaña **Datos de envío** en `/mi-cuenta`: resumen de la dirección, edición
  con validación y estado de éxito. Si faltan, aparece un aviso en la cuenta y
  el formulario se abre directamente.
- `PanelCarrito` (Descubrir) y `ModalCarrito` (ficha del restaurante) rellenan
  nombre, teléfono y dirección desde la cuenta. El carrito de la ficha muestra
  la dirección guardada como una opción seleccionable.
- Las direcciones antiguas de `localStorage` siguen teniendo prioridad local;
  la cuenta es la copia que sobrevive al cambio de navegador.

**Base de datos**

- Migración `datos_envio_cuenta` aplicada el 2026-10-27 (versión
  `20261027230628`): columnas `telefono`, `direccion`, `barrio`, `referencias`,
  `datos_envio_actualizado_en` y `datos_envio_omitidos_en` en `public.users`,
  con restricciones de longitud y teléfono.
- `handle_new_user()` normaliza el metadata, guarda solo datos completos y
  conserva lo que ya exista en un `on conflict`. La política `users_edicion`
  ya limitaba la escritura a la propia fila; se volvió a verificar con
  `set local role` y rollback: cada cuenta ve y actualiza solo su fila y no
  puede escribir la de otra.
- Prueba de extremo a extremo en la SPA con dos cuentas nuevas: una guardó los
  datos en el paso de registro y los editó desde «Mi cuenta»; la otra omitió el
  paso, completó los datos después y el carrito los reutilizó. El pedido de
  prueba guardó la dirección correcta y las cuentas y filas de prueba se
  borraron al terminar.

**Pendiente**

- Varias direcciones por cuenta (hoy hay una principal).
- Sincronizar automáticamente la dirección escrita en un pedido si la cuenta
  todavía no tiene una guardada.
