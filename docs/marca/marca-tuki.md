# Marca Tuki — sistema modular

La marca de Tuki se armaba con una «R» que no aparecía en el nombre. Esta
versión la reemplaza por una **«T» de mesa** y convierte el logo en un sistema
de tres piezas que se pueden componer sin duplicar archivos.

![Símbolo de Tuki](tuki-simbolo.svg)

La hoja completa, con las versiones horizontal, apilada, oscura y los tamaños
mínimos, está en **[tuki-marca.png](tuki-marca.png)** (fuente reproducible:
`hoja-de-marca.html`).

## 1. Concepto

**La T de la mesa.**

| Pieza | Qué representa |
| --- | --- |
| Trazo horizontal | La mesa: el lugar donde se comparte la comida. |
| Trazo vertical | La pata que la sostiene: el restaurante que la pone. |
| Chispa de cuatro puntas | La conversación: la reseña, el guardado, la recomendación. Es la misma chispa de `RobotIA`, así que la IA y la comunidad hablan el mismo idioma visual. |

La «T» deletrea **Tuki**. La «R» anterior no. Ese es el argumento de la
sustentación: la marca ahora dice el nombre y cuenta lo que el producto hace.

## 2. Anatomía modular

```
┌──────────────────────────────────────────────────────────────┐
│  SÍMBOLO              LOGOTIPO           DESCRIPTOR          │
│  (T + chispa)         (Tuki, Inter 700)  (La mesa se comparte)│
│                                                              │
│  ┌──────┐   +   Tuki   +   La mesa se comparte               │
│  │  T✦  │                                                    │
│  └──────┘                                                    │
│                                                              │
│  MarcaTuki: horizontal / apilada / solo símbolo              │
└──────────────────────────────────────────────────────────────┘
```

| Pieza | Componente | Qué es | Cuándo se usa |
| --- | --- | --- | --- |
| Símbolo | `SimboloTuki` | La «T» y la chispa, en un lienzo de 24×24. | Favicon, baldosa de la app, marca de agua, espacio cuadrado. |
| Logotipo | `PalabraTuki` | «Tuki» en Inter Bold, tracking −3,5 %. | Siempre que haya espacio para leer el nombre. |
| Descriptor | `DescriptorTuki` | Línea de marca en español. | Pie de página, portadas, piezas de marketing. |
| Marca horizontal | `MarcaTuki` (`variante="horizontal"`) | Símbolo + logotipo (+ descriptor opcional). | Barras de navegación, panel, cabeceras. |
| Marca apilada | `MarcaTuki` (`variante="apilada"`) | Símbolo arriba, logotipo y descriptor centrados. | Portadas, pantallas de carga, redes sociales. |
| Símbolo con fondo | `MarcaTuki` (`conFondo`) | La «T» blanca sobre baldosa terracota. | Barra, panel, favicon. |
| Símbolo sin fondo | `MarcaTuki` (`conFondo={false}`) | La «T» en terracota sobre papel. | Documentos, piezas claras, QR. |

`Logo` sigue exportándose como alias de `SimboloTuki`: los sitios que ya lo
importaban no se tocaron.

## 3. Geometría

| Regla | Valor |
| --- | --- |
| Lienzo del símbolo | 24 × 24 unidades |
| Trazo de la «T» | 2,6 unidades, extremos redondeados |
| Barra horizontal | 11,6 unidades |
| Asta vertical | 12 unidades |
| Chispa | 5 × 5 unidades, cuatro puntas con lados cóncavos |
| Área de respeto | El ancho de la chispa (5/24 del lado) en los cuatro costados |
| Tamaño mínimo en pantalla | Símbolo 16 px; horizontal con símbolo de 20 px; apilada de 32 px |
| Tamaño mínimo impreso | 8 mm de alto |
| Proporción logotipo/símbolo | Logotipo = 0,92 × el lado del símbolo |
| Descriptor | 0,46 × el lado del símbolo, mínimo 11 px |

La baldosa del símbolo mide `símbolo + 12 px` por lado y usa radio de 12 px.
Así el aire interior (6 px) supera el área de respeto.

## 4. Color

| Uso | Color | Token |
| --- | --- | --- |
| Fondo de la baldosa | `#C2410C` | `bg-af-accent-solid` |
| Símbolo sobre la baldosa | `#FFFFFF` | `text-white` |
| Símbolo sobre papel | `#C2410C` | `text-af-accent-text` |
| Logotipo sobre papel | `#1D1D1F` | `text-af-ink` |
| Logotipo sobre oscuro | `#FFFFFF` | `text-af-ink` (modo oscuro) |
| Descriptor | `#6E6E73` / `#98989D` | `text-af-ink-secondary` |

Reglas:

- La baldosa usa **`accent-solid`**, no `accent`. En modo oscuro `accent` se
  aclara para leerse como texto y el blanco encima perdería contraste; el token
  sólido se queda en terracota en los dos modos.
- Sin degradados, sin sombras, sin contornos, sin brillos.
- La marca no adopta la paleta del restaurante. El color del local vive en su
  página; Tuki conserva el terracota.

## 5. Versión en español

El nombre **Tuki** es un nombre propio y no se traduce. Todo lo que lo rodea sí
está en español:

| Pieza | Texto |
| --- | --- |
| Logotipo | **Tuki** |
| Descriptor de marca | **La mesa se comparte** |
| Descriptor largo | **La red de restaurantes y platos de tu ciudad** |
| Descriptor B2B (pie) | **Webs para restaurantes, hechas en Colombia** |
| Etiqueta accesible | **Tuki** / **Tuki. La mesa se comparte** |
| Nombres de componentes | `SimboloTuki`, `PalabraTuki`, `DescriptorTuki`, `MarcaTuki` |
| Props | `tamano`, `variante`, `conDescriptor`, `descriptor`, `conFondo`, `titulo` |

En la interfaz no se usan anglicismos como *feed*, *like* o *follow*: se dice
**novedades**, **me antoja**, **seguir**. El descriptor aparece solo cuando hay
espacio; en una barra de 360 px se usa la marca horizontal sin descriptor.

## 6. Dónde se aplica

| Superficie | Versión | Archivo |
| --- | --- | --- |
| Barra de Descubrir | Horizontal, símbolo 20 px, sin descriptor | `src/componentes/descubrir/BarraDescubrir.tsx` |
| Panel, cabecera desplegada | Horizontal, símbolo 22 px | `src/componentes/panel/BarraLateral.tsx` |
| Panel, raíl contraído | Solo símbolo 22 px | `src/componentes/panel/BarraLateral.tsx` |
| Autenticación | Símbolo 40 px en baldosa de 80 px | `src/componentes/autenticacion/LayoutAuth.tsx` |
| Landing, barra | Horizontal, símbolo 22 px | `src/paginas/PaginaParaRestaurantes.tsx` |
| Landing, pie | Horizontal + descriptor B2B | `src/paginas/PaginaParaRestaurantes.tsx` |
| Carga | Símbolo 40 px en baldosa de 64 px | `src/App.tsx` |
| 404 | Símbolo 64 px | `src/paginas/Pagina404.tsx` |
| Favicon | Símbolo blanco sobre baldosa terracota | `index.html` |
| Ficha de restaurante | Solo en el pie «Creado con Tuki», pequeño y sin baldosa | `src/componentes/restaurante/PlantillaRestaurante.tsx` |
| Piezas sociales futuras | Apilada + descriptor | Nuevas portadas y OG |

## 7. Lo que no se hace

- No se rota, no se estira, no se inclina.
- No se cambia la chispa por un corazón, una estrella o un tenedor.
- No se pone la marca en degradado, con sombra o con contorno.
- No se usa la chispa sola como logo: la «T» es la que dice el nombre.
- No se escribe «TUKI» en mayúsculas ni «Tuki Social».
- No se traduce «Tuki» a otro idioma.
- No se coloca sobre una foto sin una baldosa o un fondo sólido que garantice
  contraste.
- No se usa la marca de Tuki como si fuera el logo del restaurante.

## 8. Implementación

- Componente: `src/componentes/sistema-diseno/Logo.tsx`.
- Exportaciones: `SimboloTuki`, `Logo` (alias), `PalabraTuki`,
  `DescriptorTuki`, `MarcaTuki`.
- Favicon: SVG en línea en `index.html`, con trazo de 2,8 para que no
  desaparezca a 16 px.
- La chispa comparte geometría con `RobotIA`; si cambia una, cambian las dos.
- El símbolo se pinta con `currentColor`; la baldosa decide el color con
  `bg-af-accent-solid text-white`.

## 9. Cómo defender el cambio

1. «La marca anterior dibujaba una R que no estaba en el nombre; la nueva
   dibuja la T de Tuki.»
2. «La mesa y la chispa cuentan el producto: restaurantes que se comparten.»
3. «Es modular: símbolo, logotipo y descriptor se combinan según el espacio,
   sin archivos de color duplicados.»
4. «Está en español hasta en los nombres de las piezas y en las etiquetas
   accesibles; el nombre propio no se traduce.»
5. «No inventa un estilo nuevo: usa la tipografía, el terracota y los trazos
   redondeados que ya estaban en el sistema.»
