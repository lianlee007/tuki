# Tuki — DESIGN.md

## Modo de diseño
- **Landing (`/`)**: Persuade — diseño es el producto, ganar atención y acción.
- **Panel / carrito / auth**: Operate — escaneabilidad, consistencia, expectativas nativas.
- **Menú público (`/restaurante/:slug`)**: Read — estructura para comprensión, lectura sin fricción.

## Pila tipográfica (Apple)
Cuerpo y títulos: tipografía del sistema (SF Pro / San Francisco / Segoe UI / Roboto / system-ui).
```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```
Playfair Display solo para acentos editorial puntuales en la landing (nunca para cuerpo).

## Tokens de color
| Rol | Light | Dark | Uso |
|---|---|---|---|
| Fondo (ground) | `#FFFFFF` | `#000000` | Páginas completas |
| Superficie | `#F2F2F7` | `#1C1C1E` | Tarjetas, modales, barras flotantes |
| Texto principal (ink) | `#1D1D1F` | `#FFFFFF` | Títulos y texto de lectura |
| Texto secundario | `#86868B` | `#6E6E73` | Subtítulos, notas |
| Acento (accent) | `#C2410C` | `#E8834F` | Botones primarios, enlaces, estado activo |
| Borde | `#D1D1D6` (1px) | `#2C2C2E` (1px) | Separadores sutiles, casi nunca usados |
| Éxito | `#30D158` | `#30D158` | Estados positivos |
| Peligro | `#FF453A` | `#FF453A` | Estados destructivos (relleno, iconos, bordes) |
| Peligro (texto) | `#D70015` | `#FF453A` | Mensajes de error: `#FF453A` sobre blanco da 3.05:1 |

Los tokens viven como **canales RGB** (`--af-ground-rgb: 255 255 255`) y se usan como `rgb(var(--af-ground-rgb))`. Eso permite que una plantilla, un restaurante o la landing reescriban solo los canales y todo lo demás —sombras, tintes, estados— siga a la nueva paleta sin tocar una línea de CSS.

### Los cuatro colores del menú

La paleta que elige el dueño tiene cuatro voces y cada una tiene **un oficio fijo** en las nueve estructuras. Un color que no hiciera nada sería una promesa falsa en la muestra.

| Voz | Sale de | Oficio en el menú |
|---|---|---|
| **Fondo** | Fondo | El lienzo: la página entera. |
| **Marca** | Principal | El botón de pedir sólido (Tarjetas, Vitrina, Díptico) y la **tinta legible de los precios** (`accentText`), que es la marca llevada al contraste mínimo. |
| **Apoyo** | Secundario | **El plato de la casa** (`destacado`): píldora en las seis estructuras de tarjeta y estrella en Carta, Compacta y Minimal. |
| **Tinte** | Principal teñido | **La píldora del precio** en las nueve estructuras (fondo teñido, tinta de marca), más el botón "Añadir" suave de Carta y Compacta. |

Las miniaturas del panel (`SeccionDiseno`) usan la misma derivación que la página (`derivarPaleta`) y los mismos dos gestos —píldora del precio y marca del plato de la casa—, así que lo que enseña la tarjeta es lo que recibe el cliente. El contraste lo garantiza `npm run verificar:paletas` (tinta sobre su tinte ≥ 4,5:1 en las 48 paletas y en los dos modos).

## Espaciado y rejilla
- Una sola rejilla, márgenes ajustados 16–32 px, usados en todas partes.
- Gap entre secciones claramente mayor que el gap dentro de una: 120–220 px en desktop.
- Cada sección con composición distinta de su vecina; nunca una grilla de tarjetas idénticas.

## Bordes y sombras (reglas de la casa Apple)
- **No gradientes** como fondo, ni en botones, ni en texto.
- **No sombras en elementos en reposo.** Solo paso de tono entre superficies.
- Sombras solo en lo que realmente flota: menús desplegables, diálogos, toasts.
- **No reglas finas** (hairlines), ni cajas con borde de 1 px, ni cruces ni marcas de corte.
- **No monospace** fuera de bloques de código reales.
- **No cejas** (etiqueta pequeña sobre el título, ni "Nuevo ·" chip).
- **No numeración de índice** (01 / 02 / 03).
- **No icon-topped feature cards** ni filas de tarjetas idénticas.
- **No vidrio** (backdrop blur paneles flotantes) excepto barra de navegación sticky y modales con fundido.
- Dos tipografías como máximo, normalmente una.
- Íconos: línea fina, mismos pesos, relleno solo en estado activo.

## Componentes
- **Botón**: plano, un solo color de relleno, cuadrado con radio medio (9–12 px) o totalmente redondo (decisión única por proyecto). Hover: opacidad o ligero desplazamiento vertical, nunca escala brusca.
- **Entrada (input)**: borde sutil de 1 px, focus con anillo de acento (2 px), fondo superficie, nunca neumorfismo.
- **Tarjeta**: fondo superficie, radio 24–32 px, sin borde o borde de 1 px muy suave, sombra solo al hacer hover (elevación ligera).
- **Interruptor de tema** (`ThemeToggle`): raíl de 56×32 px con el sol a la izquierda y la luna a la derecha; una bolita blanca de 24 px se desliza hasta la mitad activa con curva de muelle (`--af-muelle`, se pasa ~6 % y se asienta) y el icono activo se **rellena** (sol ámbar, luna índigo) mientras el otro queda apagado y 20 % más pequeño. El raíl es un tinte del color de texto de la paleta (`rgb(var(--af-ink-rgb) / 0.14)`), así que sirve igual en la landing y dentro de un restaurante; la bolita es blanca siempre, para que el icono activo tenga el mismo contraste en claro y en oscuro. La posición y el relleno dicen el estado a la vez (nunca solo el color) y es `role="switch"` con `aria-checked`.
- **Cambio de modo.** Cambiar claro ↔ oscuro no salta: `ContextoTema` abre una ventana de `--af-cambio-tema-ms` (280 ms) con `.af-tema-cambiando` en `<html>` y todo el árbol interpola sus colores a la vez. Si no, solo cruzarían las superficies que ya tenían transición propia y el resto saltaría — peor que no animar nada. En el primer render no se anima, para que abrir la página en oscuro no sea un parpadeo.
- **Navegación**: wordmark, 3–5 enlaces planos, una acción. Sin cromo de barra.
- **Footer**: cierre diseñado, nombre del restaurante a ancho completo, no un mapa del sitio.

## Animaciones (apple-design + animate)
- Solo `transform` y `opacity` (y `clip-path` cuando corresponda). Nunca `width/height/margin/padding/top/left`.
- Entrada/salida: `ease-out`. Movimiento en pantalla: `ease-in-out`. Hover/cambio de color: `ease`. Nunca `ease-in` en UI.
- Duraciones: feedback de presión 100–160 ms; tooltips/popovers 125–200 ms; desplegables 150–250 ms; modales/cajones 200–500 ms. Todo bajo 300 ms salvo contenido explicativo de marketing.
- Nunca `scale(0)`. Entrada desde `scale(0.95–0.97)` + `opacity: 0`.
- `transform-origin` en el disparador para popovers/menús/tooltips. Modales exentos (centrados).
- Transiciones (no keyframes) para elementos disparados rápido (toasts, toggles). Springs para gestos, arrastrar e interrumpir.
- Escalonamiento de entradas de grupo: 30–80 ms. Nunca todo entra a la vez.
- `prefers-reduced-motion`: crossfade suave, eliminar desplazamientos y cambios de posición, mantener cambios de opacidad/color que ayuden a la comprensión. La única excepción es el interruptor de tema: conserva un deslizamiento corto (150 ms, sin rebote) porque son 24 px dentro de un control de 56 px, en el punto donde está mirando el usuario.
- No animar elementos de alta frecuencia (atajos de teclado, paleta de comandos, navegación vista 100+ veces/día).

## Imágenes (taste-skill)
- Una imagen dominante gana a seis pequeñas. El medio del héroe cubre al menos la mitad de la primera pantalla.
- Mismos ratios de recorte, mismo tratamiento, esquinas cuadradas salvo que la dirección diga lo contrario.
- Sin placeholders, íconos ni formas abstractas. Una imagen dibujada para este sujeto supera a ambas. Una imagen real de su mundo, encontrada y creditada, supera todavía más.
- Al menos 4 imágenes reales por página (generalmente 6–12).
- Nada se superpone sobre titulares ni frases afirmativas.

## Especial: descubrir (`/`)
La portada social. Es una superficie **Operate** —el visitante viene a encontrar qué comer— y por eso el buscador **es** la página: no hay héroe con foto, solo un titular de una línea («¿Qué se te antoja?») y un campo siempre visible que en móvil ocupa una fila entera.
- **Cromo neutro, el color lo pone la comida.** Ninguna paleta de restaurante se aplica aquí: cuarenta y ocho acentos a la vez serían una feria y ninguno significaría nada. El color de cada restaurante vive en su propia página; en el feed solo hay tinta, superficie y fotografías.
- **Carril de cocinas.** Pastillas planas con el icono **dentro** de la pastilla (nunca iconos encima de tarjetas): inactivas en superficie, la activa en tinta llena. Contraste de la activa: 16.8:1 en claro y en oscuro («Todas», «Cafetería», «China»… 23 cocinas, `tipos_cocina`).
- **Carril de restaurantes.** Debajo de las cocinas y encima de los platos: tarjetas de 232 px con la portada del local, su cocina, su ciudad, cuántos platos publica y el precio más bajo. Se arrastra con el pulgar, sin flechas ni paginación. Responde al texto y a la cocina —las mismas puertas que el feed—, pero no al precio ni a la dieta: esos filtros son del plato, no del local. Un restaurante sin platos publicados no aparece: una tarjeta que lleva a un menú vacío es una promesa rota.
- **Filtros en hoja.** Se abren en una hoja (portal a `document.body`, centrada en escritorio y pegada al borde inferior en móvil) con tres rangos de precio y tres preferencias. **Se aplican al instante** y el botón de cierre dice cuántos platos quedan («Ver 28 platos»): no hay un «Aplicar» que prometa algo distinto de lo que ya se ve. `Esc`, clic en el velo y bloqueo del scroll de fondo.
- **La URL es el estado.** `?q=&cocina=&precio=&dietas=` con `replace`: atrás y adelante devuelven el mismo feed y cualquier vista se puede compartir. Escribir espera 280 ms antes de pedir. Una pastilla por filtro activo, con su aspa para quitarlo.
- **Tarjeta honesta.** Foto, nombre, restaurante, cocina, precio y «Ver menú». El precio es tinta, no color de marca, porque aquí no hay tema del que heredar. El enlace se estira sobre toda la tarjeta (`after:inset-0`) y apunta a `/restaurante/:slug?plato=id`, que abre el detalle de ese plato directamente (nada de dejar al visitante buscándolo otra vez en la carta). El **+** flota abajo a la derecha de la foto, separado del enlace: agrega al carrito de verdad, no es un favorito disfrazado. Un solo botón real por tarjeta; ningún icono decorativo.
- **Carrito de un solo restaurante.** El **+** avisa en el borde del plato; abajo aparece una barra flotante solo cuando hay algo y el visitante es cliente. La hoja del pedido reutiliza el patrón de las hojas de filtros (misma entrada, `Esc`, velo, scroll bloqueado) y lleva los datos de entrega dentro, no en una pantalla aparte. Si el plato es de otro local, una hoja lo dice antes de vaciar: «Tu carrito es de X». Sin cuenta, la hoja pide entrar justo en ese momento; para una cuenta de restaurante, ofrece cambiar de cuenta en vez de fingir que puede pedir.
- **Dos puertas de acceso.** `/entrar` es del comensal y `/auth` del restaurante: mismo formulario, distinto copy y distinto rol. La flecha de volver y el destino posterior al login cambian con la puerta; el panel nunca se muestra a un cliente.
- **Ritmo.** Dos columnas en tableta y tres en escritorio; la primera tarjeta ocupa dos cuando no hay filtros, para que la retícula no sea una cuadrícula idéntica. Rejilla de 24 y «Ver más platos» para el resto. Al cambiar de filtro los resultados anteriores se atenúan (`opacity-60` + `aria-busy`) en lugar de desaparecer: la consulta tarda milisegundos y un parpadeo de esqueletos se siente roto.
- **Esqueletos estáticos**, sin pulso: el movimiento se reserva para lo que el visitante provoca. Contraste medido en claro: tinta 16.8:1, secundario 4.54:1. En oscuro: 16.8:1 y 6.4:1.
- **Estados.** Vacío y error comparten forma (icono en superficie, título, una frase, **una** acción: «Quitar los filtros» o «Reintentar»). El pie lleva la única puerta al lado profesional.

## Especial: landing (`/para-restaurantes`)
- **Paleta cálida propia (`.af-landing`).** La landing es la superficie de Persuade que habla de comida, así que va entera en cálido. Claro: `ground 251 248 244`, `surface 242 236 228`, `ink 34 28 24`. Oscuro: `ground 19 17 16`, `surface 31 28 26`, `ink 245 241 236`. El acento no se declara aquí: es el terracota de la marca y vive una sola vez, en `:root` y en `.dark`, así que la landing, el panel, la autenticación y el menú público comparten el mismo. Lo único que la landing cambia de verdad es el papel y la tinta; el panel y el menú público siguen neutros de fondo para rendirse ante la marca de cada restaurante. Contrastes comprobados: acento-texto 4.89:1 sobre el papel y 5.18:1 sobre blanco en claro, 6.99:1 en oscuro, blanco sobre acento sólido 5.18:1.
- **Bandas.** El ritmo alterna papel y superficie (`bg-af-surface/60`) para separar secciones sin líneas ni sombras. Todo el color sale del canal `surface`; nunca de un gris de Tailwind, que sobre una paleta cálida se ve como una mancha fría.
- **Anclas.** La barra lleva a `#como-funciona`, `#beneficios`, `#precios` y `#ejemplos`. Cada sección es un `Seccion` con `id`, y eso es lo que le añade su `scroll-mt-28` (112 px: la altura de la barra) para que el título no quede escondido debajo de la barra fija.
- **Muestra, no cuenta.** Una sola captura viva del menú (`MenuDemo`) dentro de tres marcos reales (`Marcos`): teléfono 268×560, tableta 660×500 y portátil 780×440 con cromo de navegador. El menú se dibuja distinto a propósito —filas horizontales en el teléfono, rejilla de dos columnas en tableta y portátil— porque de eso va la sección. El recorte va en el envoltorio, nunca en la rejilla: si la rejilla recibe altura definida, `align-content: stretch` reparte esa altura entre las filas y aplasta las tarjetas. El cambiador de aparato solo aparece desde `lg` (el portátil mide 856 px); por debajo se muestra el teléfono.
- **Aparición al bajar (`Revelar`).** Los bloques nacen visibles y solo se esconden si hay JS, así que sin script el contenido se lee igual. El marcador `af-revelar--listo` arma la transición **después** de medir, para que el primer render no dispare un fundido de 1 a 0. El barrido es síncrono, desde un único escucha de `scroll`/`resize`/`visibilitychange` compartido por todos los bloques, y **sin `IntersectionObserver`**: si el visitante salta a un ancla y el bloque entra y sale entre dos avisos, el observador no avisa nunca y el bloque se queda invisible para siempre. Barriendo, lo que ya quedó por encima también cuenta como «asomado» y se revela sin que se vea el movimiento.
- **Un solo mensaje por pantalla.** El héroe no rota titulares; los pasos no llevan número ni tarjeta; en precios solo el plan recomendado se eleva y solo él lleva botón relleno (los demás terminan en enlace de acento). Menos texto, más prueba visual.

## Especial: panel de control (`/panel`)
- **Barra lateral plegable.** En escritorio la barra alterna entre 288 px (con etiquetas) y 76 px (raíl de iconos). Para plegarla hay un botón con nombre (**Contraer**) en la cabecera; en el raíl la marca lleva una flecha pegada que delata que se pulsa para desplegar, y cada opción conserva su `title`. Al plegar, las etiquetas de grupo se ocultan con `opacity-0` (no con `hidden`) para que el aire entre bloques no cambie. La preferencia se recuerda en `localStorage` (`tuki_barra_contraida`). En móvil es un cajón que entra por la izquierda y nunca se pliega.
- **Excepción de movimiento, una sola.** El ancho de la barra **sí** se anima (`width` + `transform`, 300 ms, `cubic-bezier(0.32,0.72,0,1)`), porque es un cambio de estructura pedido por el usuario —como la barra de Mail en macOS— y no una animación de hover o de entrada. Sigue bajo `prefers-reduced-motion` (la regla global deja las transiciones en 0.01 ms). En ningún otro sitio se anima `width`.
- **Asistente de IA.** Una tarjeta con tinte suave del acento (plano, sin degradado), la cabeza del robot (`RobotIA`), qué escribe la IA y **un** botón claro que dice exactamente lo que va a pasar («Generar eslogan y descripción», «Completar el plato»). Debajo, las acciones por campo son pastillas discretas (`BotonIA`): icono en acento, texto legible, fondo solo al pasar el ratón.
- **Marca del asistente.** `RobotIA` es una cabeza redondeada cuya antena termina en la misma chispa de cuatro puntas que la «T» de Tuki, para que se lea como parte de la marca y no como un icono genérico de «IA». Un solo grosor de trazo; ojos y chispa rellenos para que a 16 px la cara no desaparezca.
- **Guardar es explícito.** Formulario y editor comparten la misma banda inferior pegajosa y difuminada: estado a la izquierda, acciones a la derecha, y a ancho completo en móvil (nunca se desborda). Los campos que faltan se marcan en rojo y el foco va al primero con error.
- **Ritmo del formulario.** Cada bloque abre con un icono pequeño en un cuadrado con tinte de acento y el título en tinta (no en acento). Las tarjetas van sobre el fondo sin borde ni sombra en reposo; los estados (publicado, completitud) son tarjetas de superficie, nunca cajas con `border-left` de color.
- **Completitud visible.** El estado de publicación muestra un contador `completos/total` con barra fina y pastillas de peligro para cada campo que falta; tocarlas lleva al campo.

## Especial: restaurante público
La vista pública (`/restaurante/:slug`) hereda los colores y tipografía del tema del restaurante, pero respeta las reglas de la casa Apple: planos, tipografía sistema, espaciado generoso, sin sombras de reposo, imágenes del menú cuadradas y recortadas igual, carrito y detalle con modal plano y fluido.
