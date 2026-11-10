# Marca TukiTuki 2026 — La chispa de la mesa

Identidad **adoptada en la V2**. Sustituye el símbolo de la «T de mesa» por una
marca de objeto: **una mesa con una llama encendida en el centro**. La chispa
de cuatro puntas se retira —se confundía con el destello de otras marcas de
IA— y en su lugar queda una llama, que es propia, cálida y de restaurante. El
nombre sigue diciendo Tuki; la llama vive ahora en la mesa y, más grande, en el
punto de la «i».

Este documento y sus archivos son la fuente de verdad de la marca. No se
publican: acompañan al monorepo para defender las decisiones y permitir la
adopción sin volver a dibujar nada.

---

## 1. La idea

**TukiTuki es la chispa que se hizo llama en una mesa.**

- **La mesa** es el lugar donde se encuentran el restaurante y el comensal. Es
  un objeto cotidiano, reconocible y hospitalario: un tablero con dos patas, una
  mesa para dos.
- **La llama** es el encuentro: la recomendación, la conversación, la reseña, la
  idea que prende al probar un plato. Ya no es un destello de cuatro puntas que
  flota al lado de una letra; es una llama que **se apoya en el tablero**. La
  chispa se hizo llama.
- **El nombre** lleva la llama en el punto de la «i», y la lleva **más grande**
  que un punto normal: 165 × 250 unidades frente a las 150 × 150 del punto
  original. En «TukiTuki» hay dos llamas, una por cada Tuki. La repetición del
  nombre deja de ser un trabalenguas y se convierte en el ritmo de la marca.

La mesa no es una letra. Es un objeto con una escena: alguien encendió una llama
sobre la mesa. Esa es la diferencia con la marca anterior, que era una «T»
disfrazada de mesa. Aquí la «T» desaparece del símbolo y se queda donde
corresponde: en el logotipo.

## 2. Las tres piezas

| Pieza | Qué es | Dónde se usa |
| --- | --- | --- |
| **Símbolo** | La mesa con la llama apoyada. | Icono, favicon, baldosa, sello, marca de agua. |
| **Logotipo** | «Tuki» en Plus Jakarta Sans ExtraBold, con la llama en la «i». | Barras, cabeceras, portadas. |
| **Descriptor** | «La mesa se comparte». | Portadas, pie, marketing. |

La marca compuesta existe en **horizontal**, **apilada** y **solo símbolo**. El
nombre completo **TukiTuki** tiene su propio logotipo con dos llamas.

## 3. Geometría

Lienzo de 64 × 64. La marca ocupa 40 × 43 y queda centrada.

| Regla | Valor |
| --- | --- |
| Llama | 15 × 25; caja x 24,5–39,5 / y 8,5–33,5; base apoyada en el tablero. |
| Tablero | 40 × 7, radio 3.5; de x = 12 a 52, de y = 32.5 a 39.5. |
| Patas | 6 × 12, radio 2; x = 18–24 y 40–46. |
| Caja de la marca | 40 × 43, centrada en (32, 30). |
| Aire mínimo | 8 unidades alrededor (12.5 % del lienzo). |
| Baldosa | Radio 15/64 (23.4 %); el símbolo al 112 %. |
| Maskable | Símbolo al 84 %, dentro de la zona segura del 80 %. |

La llama y la mesa son **una sola pieza**: su base se apoya en el tablero y se
hunde 1 unidad en él. No flota. Esa unión es la que evita que la marca se lea
como «una estrella sobre una mesa» y la convierte en «una llama encendida en la
mesa».

## 4. Tipografía

| Uso | Familia | Peso | Detalle |
| --- | --- | --- | --- |
| Logotipo | Plus Jakarta Sans | 800 ExtraBold | Tracking −4,5 %; la «i» pierde su punto y lo sustituye por la llama. |
| Títulos | Plus Jakarta Sans | 700 | — |
| Texto | Inter | 400 / 500 | — |
| Descriptor | Inter | 500 | 11–13 px, color secundario. |

El logotipo está trazado a partir de la fuente y vive en `logotipo.svg`; no se
compone con texto vivo en producción. La llama del punto mide **165 × 250
unidades**: un 10 % más ancha y un 67 % más alta que el punto original. El
trazado de la llama se genera desde el mismo dibujo del símbolo, así que la
mesa y el nombre comparten forma.

## 5. Color

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| Terracota | `#C2410C` | `#C2410C` | Símbolo, baldosa, acentos. |
| Papel | `#FBF8F4` | `#131110` | Fondo. |
| Tinta | `#1D1D1F` | `#F5F1EC` | Logotipo y texto. |
| Secundaria | `#6E6E73` | `#A79C93` | Descriptor. |
| Superficie | `#F2ECE4` | `#1F1C1A` | Tarjetas. |
| Borde | `#E6DCD0` | `#2E2824` | Separadores. |

Una sola tinta por pieza. El símbolo no lleva degradados, sombras, contornos ni
un segundo color: la llama y la mesa comparten el mismo relleno.

## 6. Archivos

```
tukituki-2026/
├─ simbolo.svg                 Símbolo terracota, fondo transparente.
├─ simbolo-blanco.svg          Símbolo blanco.
├─ simbolo-monocromo.svg       Símbolo en tinta.
├─ logotipo.svg                «Tuki» terracota, llama en la «i».
├─ logotipo-blanco.svg         «Tuki» blanco.
├─ logotipo-tukituki.svg       «TukiTuki», dos llamas.
├─ logotipo-tukituki-blanco.svg
├─ marca-horizontal.svg        Símbolo + «Tuki».
├─ marca-horizontal-blanco.svg
├─ marca-apilada.svg           Símbolo sobre «Tuki».
├─ marca-apilada-blanco.svg
├─ icono.svg                   Baldosa de aplicación (64).
├─ icono-maskable.svg          Fondo a sangre y zona segura.
├─ favicon.svg                 Favicon vectorial.
├─ iconos/                     PNG 16–512, apple-touch, maskable e ICO.
├─ scripts/                    Regenera símbolo, logotipos, lockups y captura.
├─ hoja-de-marca.html          Fuente reproducible de la hoja.
├─ marca-tukituki-2026.png     Hoja de marca exportada.
├─ proceso/                    Exploraciones, llama y prueba de píxeles.
└─ fuentes/                    Plus Jakarta Sans ExtraBold (para regenerar).
```

`proceso/` conserva las hojas de exploración, la prueba de píxeles del favicon y
la comparativa de llamas. No es un entregable: es la defensa del descarte, por
si alguien pregunta por qué una llama y no una estrella, un puesto o una olla.

Los PNG se derivan de los mismos trazados: el render a 512 está en
`proceso/render-final.html` y el recorte a 16–512 se hace con el set de
`iconos/`. Los logotipos se trazan desde `fuentes/PlusJakartaSans-ExtraBold.ttf`
con los scripts de `scripts/`.

## 7. Dónde se aplica en la V2

| Superficie | Versión | Tamaño |
| --- | --- | --- |
| Barra de Descubrir | Símbolo 28 px + «Tuki» 24 px | 28 / 24 |
| Panel, cabecera | Marca horizontal 22 px | 22 |
| Autenticación | Símbolo 56 px en baldosa de 80 px | 56 / 80 |
| Landing | Marca horizontal 22 px | 22 |
| Carga | Símbolo 46 px en baldosa de 64 px | 46 / 64 |
| 404 | Símbolo 64 px | 64 |
| Administración | Símbolo 22 px en baldosa de 32 px | 22 / 32 |
| Favicon | `favicon.svg` + ICO 16/32/48 | 16–48 |
| Instalación | 192 / 512 / maskable | 192–512 |

El símbolo completo no baja de **32 px**. Por debajo, se usa el **icono** (la
baldosa) o la **llama** sola como acento, nunca la mesa sin baldosa.

## 8. Favicon

El favicon es la baldosa con la mesa y la llama. A 16 px la mesa se lee como
tablero con dos patas y la llama como una luz vertical: la marca no se convierte
en una letra ni en una estrella. El set incluye:

| Archivo | Tamaño |
| --- | --- |
| `favicon.svg` | vectorial |
| `favicon.ico` | 16, 32 y 48 |
| `favicon-16.png` · `favicon-32.png` · `favicon-48.png` | 16, 32 y 48 |
| `apple-touch-icon.png` | 180, a sangre |
| `icono-192.png` · `icono-512.png` | 192 y 512, a sangre |
| `icono-maskable-512.png` | 512 con zona segura |

## 9. Lo que no se hace

- No se separa la llama del tablero: sin la unión deja de ser una llama
  encendida y vuelve a ser un símbolo suelto.
- No se convierte la llama en estrella, destello ni chispa de cuatro puntas.
- No se le añaden platos, cubiertos, corazones, humo ni adornos.
- No se rellena la llama de otro color ni se le pone contorno.
- No se usan degradados, sombras, biseles ni texturas dentro de la marca.
- No se rota, inclina, estira ni comprime.
- No se sustituye la mesa por un icono de interfaz (carrito, campana, cubiertos).
- No se usa la llama sola como logotipo principal: es el acento de la «i», del
  asistente y de las animaciones.
- No se usa la marca como logo del restaurante.
- No se escribe «TUKI» en mayúsculas ni se traduce el nombre.
- No se pone sobre una foto sin baldosa o velo sólido.

## 10. Implementación

La marca ya está integrada en la V2:

1. `SimboloTuki` y `PalabraTuki` viven en
   `packages/experiencia-tuki/src/componentes/sistema-diseno/Logo.tsx`; los
   trazados, en `marca-trazados.ts`.
2. La barra de Descubrir lleva la baldosa de 44/48 px y «TukiTuki» a 22 px; el
   panel, la landing y Mi cuenta usan `MarcaTuki` a 24–26 px; la autenticación,
   la carga y el 404 usan la baldosa con el símbolo grande.
3. Los favicons y manifiestos están en `public/` de las tres apps y enlazados
   desde sus `index.html`.
4. `RobotIA` usa una llama en miniatura en la antena.
5. Cada cambio asistido por IA se registra en
   `docs/security/registro-uso-ia.md`.

Para una app nueva, copiar `iconos/` y `favicon.svg` a `public/`, enlazar el
manifiesto y reutilizar `MarcaTuki` o `SimboloTuki`. No hace falta duplicar
trazados: el logotipo viaja con el paquete compartido.

---

TukiTuki · La mesa se comparte · Noviembre de 2026

