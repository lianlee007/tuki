# Tuki - PRODUCT.md

## Producto
Tuki son dos capas sobre la misma base de restaurantes. La primera es **Descubrir**: un buscador de platos —por cocina, precio y preferencias— que lleva a la carta de cualquier restaurante de la ciudad. La segunda es el **constructor de sitios web para restaurantes** (SaaS) con el que cada dueño publica y mantiene ese menú en minutos, sin escribir código. La primera da a los comensales una razón para entrar; la segunda es el negocio.

## Audiencia
Dos públicos, uno a cada lado del producto:
- **Comensales** (portada `/`): buscan qué comer, filtran por cocina y precio y llegan al menú del restaurante. No pagan ni se registran para mirar.
- **Dueños de restaurantes pequeños y medianos** (`/para-restaurantes`): sin conocimientos técnicos, necesitan presencia online profesional, menú online, pedidos por WhatsApp y códigos QR.

## Objetivo principal (one thing)
Que quien busca comida encuentre un plato en la portada en menos de un minuto y que el dueño entienda en una pantalla: "Puedo tener la web de mi restaurante con menú real y pedidos directos por WhatsApp, sin comisiones, en menos de 10 minutos".

## Páginas y superficies
| Ruta | Superficie | Modo Apple | Descripción |
|---|---|---|---|
| `/` | Descubrir (portada) | **Operate** | Buscador, carril de restaurantes, filtros por cocina/precio/preferencias, feed de platos y carrito de un solo restaurante. |
| `/explorar` | Descubrir (alias) | **Operate** | La misma página; los filtros viven en la URL, así que es un enlace compartible. |
| `/para-restaurantes` | Landing de venta | **Persuade** | Hero, beneficios, precios, portafolio, CTA principal. Antes vivía en `/`. |
| `/entrar` | Acceso de comensales | **Operate** | Login y registro de cliente. Acepta `?volver=` para regresar a la vista de origen. |
| `/auth` | Acceso de restaurantes | **Operate** | Login y registro del dueño; al registrarse se crea su «Mi Restaurante». |
| `/panel` | Panel de administración | **Operate** | Solo para `rol = restaurante`. Gestión de restaurante, menú, temas, horarios y tipo de cocina. |
| `/restaurante/:slug` | Menú público del restaurante | **Read** | Carta, detalle de platos, carrito, envío por WhatsApp. Acepta `?plato=id` para abrir el detalle. |
| `/qr` | Generador QR | **Operate** | Creación de códigos QR para mesas. |
| `/terminos`, `/privacidad` | Legal | **Read** | Documentación legal. |

## Dos públicos, dos puertas
- La cuenta lleva un **rol** en `public.users.rol`: `cliente` (comensal) o `restaurante` (dueño). Las cuentas anteriores al cambio son de restaurante; las nuevas nacen como cliente salvo que el formulario de `/auth` pida lo contrario.
- Un cliente entra por `/entrar` y vuelve a la portada o a la ruta de la que venía. Un restaurante entra por `/auth` y aterriza en `/panel`. El panel exige el rol: si un cliente abre `/panel`, vuelve a `/`.
- **Explorar no pide cuenta.** El carrito sí: el aviso aparece al pulsar «+», no al abrir la página, y ofrece entrar o crear la cuenta sin perder la vista.
- El carrito es **de un solo restaurante**. Si se agrega un plato de otro local, se avisa y se ofrece empezar de cero. Se guarda por usuario en `localStorage`, sobrevive a la recarga y no se mezcla entre cuentas.
- El pedido se cierra por **WhatsApp** al restaurante, con los mismos datos de entrega que el menú público reutiliza (`tuki_user_basic_<uid>` y la primera dirección guardada).

## Stack
React 19, TypeScript 5.8, Vite, Tailwind CSS, Framer Motion, React Router 7, Zustand, Supabase, Groq (IA), Cloudinary.

## Restricciones de la reforma
- Mantener **toda** la funcionalidad existente: rutas, autenticación, carrito, WhatsApp, plantillas de restaurante, IA generativa, temas de color, modo oscuro/claro.
- Cambiar **solo** la capa de presentación y experiencia (diseño + animación + copia).
- Estética objetivo: calidad de software, interfaz tipo Apple (plana, tipografía sistema, espacios generosos, sombras casi nulas, blur en barras flotantes, transiciones suaves, spring para gestos).
- Sin neumorfismo, sin gradientes decorativos, sin icon-topped feature cards, sin reglas de 1px, sin monospace fuera de código.

## Métricas de éxito (criterios de inspección)
- Headlines: máximo 2 líneas en cualquier ancho.
- Al menos 4-6 imágenes reales o ilustradas por página (sin placeholders genéricos).
- Botones planos, un solo color de relleno, radio cuadrado o totalmente redondo (decisión única).
- Navegación: wordmark + 3-5 enlaces planos + 1 acción.
- Animaciones solo en elementos ocasionales (entradas de página, modales, toasts); nunca en atajos de teclado ni elementos vistos 100+ veces/día.
- `prefers-reduced-motion` respetado en todo el sitio.
