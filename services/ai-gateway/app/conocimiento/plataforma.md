# TukiTuki

TukiTuki es una plataforma de menús digitales y pedidos por WhatsApp para
restaurantes de Popayán y el Cauca. El comensal descubre restaurantes, lee la
carta, arma su pedido y lo envía al local por WhatsApp. TukiTuki no procesa
pagos en línea ni cobra comisiones al comensal.

## Cuenta de comensal

Cualquiera puede explorar los restaurantes y ver sus menús sin crear cuenta.
Para guardar el carrito, escribir reseñas y consultar tus pedidos necesitas una
cuenta con correo y contraseña. La contraseña se guarda cifrada con Argon2id;
nadie del equipo puede leerla. Si olvidaste la contraseña o no puedes entrar,
escribe al equipo de soporte desde el formulario de contacto.

## Cuenta de restaurante

Un dueño se registra con su correo y entra al panel del restaurante. Desde ahí
puede completar la información del local, publicar el menú, subir fotos, marcar
platos agotados, cambiar el tema visual, revisar pedidos y responder reseñas.
Los cambios se ven en la página pública del restaurante apenas se guardan.

## Menú digital y QR

Cada restaurante tiene una página pública con su propia dirección y un código
QR para compartir en mesas, vitrinas y redes. El menú se organiza por
categorías y cada plato muestra nombre, descripción, precio, ingredientes,
alérgenos y foto cuando el restaurante la sube. La búsqueda dentro del menú
filtra por nombre y descripción.

## Crear y editar platos

En el panel, la sección Menú permite crear un plato con nombre, categoría,
precio, descripción, ingredientes, alérgenos, foto y estado (disponible,
agotado u oculto). El asistente de IA puede sugerir descripciones y nombres a
partir de los datos que ya escribiste; siempre se pueden editar antes de
guardar. Un plato agotado sigue visible pero no se puede pedir.

## Pedidos

El comensal arma el carrito con los platos del restaurante y envía el pedido
por WhatsApp. El restaurante confirma disponibilidad, tiempo de preparación y
forma de entrega directamente en esa conversación. TukiTuki no cobra ni retiene
pagos: el pago se acuerda con el restaurante. Si el local está cerrado, la
plataforma avisa y no permite enviar el pedido.

## Reseñas

Las reseñas son públicas en cuanto el comensal las envía: no hay aprobación
previa. Se califica de 1 a 5 estrellas, se puede escribir un comentario y
adjuntar una foto. El restaurante puede publicar una respuesta por reseña. Las
demás personas pueden marcar una reseña como útil. El promedio y la
distribución se calculan con todas las reseñas visibles del restaurante. No se
muestra el correo de quien escribe, solo el nombre que decidió publicar.

## Privacidad y datos

TukiTuki usa el correo y el nombre para identificar la cuenta, y guarda la
contraseña cifrada. Las fotos de platos y reseñas se alojan en el
almacenamiento del proyecto. Los datos no se venden ni se comparten con
terceros ajenos al servicio. En el navegador se guardan el tema, el carrito y
la sesión para que la experiencia sea continua. Para solicitar la eliminación
de una cuenta o de una foto, escribe al equipo de soporte.

## IA local

El recomendador y el asistente de textos usan un modelo de lenguaje que corre
en el mismo equipo del proyecto (Ollama), sin enviar los datos a un proveedor
externo. La IA puede sugerir platos o redactar descripciones, pero no toma
pedidos, no cobra y no da consejos médicos. Si hay una alergia, la información
del plato y la confirmación del restaurante son la fuente de verdad.

## Planes y costos

TukiTuki no aplica recargos ni comisiones al comensal: cada restaurante fija
los precios de su carta. Los planes para restaurantes y cualquier costo de
publicación se acuerdan directamente con el equipo de TukiTuki.

## Soporte

Para dudas de la cuenta, problemas con el panel, un pedido o una reseña,
escribe al equipo desde el formulario de contacto de la página o desde la
sección de difusión del panel del restaurante. Incluye el nombre del
restaurante y, si aplica, el número del pedido.
