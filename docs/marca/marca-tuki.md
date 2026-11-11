# Marca Tuki — V2

La marca vigente de la V2 es **«La chispa de la mesa»**: una mesa con una llama
encendida y un logotipo con la llama en el punto de la «i». Sustituye la «T de
mesa» anterior. El manual completo, la hoja y todos los archivos editables
viven en [`tukituki-2026/`](tukituki-2026/README.md).

![Símbolo de Tuki](tuki-simbolo.svg)

La hoja completa está en **[tuki-marca.png](tuki-marca.png)** (fuente
reproducible: [`tukituki-2026/hoja-de-marca.html`](tukituki-2026/hoja-de-marca.html)).

## 1. Piezas y componentes

| Pieza | Componente | Dónde vive |
| --- | --- | --- |
| Símbolo | `SimboloTuki` | `packages/experiencia-tuki/src/componentes/sistema-diseno/Logo.tsx` |
| Logotipo | `PalabraTuki` | El mismo archivo; el trazado vive en `marca-trazados.ts` |
| Descriptor | `DescriptorTuki` | El mismo archivo |
| Marca compuesta | `MarcaTuki` | El mismo archivo |
| Asistente | `RobotIA` | `.../sistema-diseno/RobotIA.tsx`, con la llama en la antena |
| Alias compatible | `Logo` | Exportado como `SimboloTuki` |

`PalabraTuki` acepta `nombre="Tuki"` (producto) o `nombre="TukiTuki"`
(mercado). La marca compuesta existe en horizontal, apilada y solo símbolo.
Todo se pinta con `currentColor`; la baldosa de `MarcaTuki` fija el terracota
sólido y el símbolo en blanco.

## 2. Geometría

| Regla | Valor |
| --- | --- |
| Lienzo | 64 × 64 |
| Llama | 15 × 25; caja x 24,5–39,5 / y 8,5–33,5; base apoyada en el tablero |
| Tablero | 40 × 7, radio 3,5; x 12–52 / y 32,5–39,5 |
| Patas | 6 × 12, radio 2; x 18–24 y 40–46 |
| Caja de la marca | 40 × 43, centrada en (32, 30) |
| Baldosa | Radio 15/64; el símbolo al 112 % |
| Maskable | Símbolo al 84 %, dentro de la zona segura |
| Llama de la «i» | 165 × 250 unidades de la fuente; un 67 % más alta que el punto original |

La llama y la mesa son una sola pieza: la base de la llama se apoya en el
tablero. La chispa de cuatro puntas se retiró porque se confundía con el
destello de otras marcas de IA.

## 3. Dónde se aplica

| Superficie | Versión | Archivo |
| --- | --- | --- |
| Barra de Descubrir | Baldosa 44/48 px + «TukiTuki» 22 px + «Mercado culinario» | `.../componentes/descubrir/BarraDescubrir.tsx` |
| Descubrir | Compás 20/22 px en baldosa de 36/40 px | `.../componentes/inspiracion/BarraInspiracion.tsx` |
| Panel, cabecera | `MarcaTuki` 26 px | `.../componentes/panel/BarraLateral.tsx` |
| Autenticación | Símbolo 46 px en baldosa de 80 px | `.../componentes/autenticacion/LayoutAuth.tsx` |
| Landing | `MarcaTuki` 26 px | `.../paginas/PaginaParaRestaurantes.tsx` |
| Mi cuenta | `MarcaTuki` 24 px | `.../paginas/PaginaMiCuenta.tsx` |
| Carga | Símbolo 46 px en baldosa de 64 px | `.../App.tsx` y `apps/*/src/App.tsx` |
| 404 | Símbolo 64 px en baldosa terracota de 128 px | `.../paginas/Pagina404.tsx` |
| Administración | Símbolo 20 px en la cabecera | `packages/ui-kit/src/componentes.tsx` |
| Favicon | `favicon.svg` + ICO 16/32/48 | `apps/*/public/` |
| Instalación | 192, 512 y maskable | `apps/*/public/manifest.webmanifest` |

El símbolo completo no baja de 32 px. Por debajo se usa la baldosa; la llama
sola queda como acento de la «i», del asistente y de las animaciones.

## 4. Favicons y manifiestos

Cada app sirve su propio set desde `public/`:

| Archivo | Tamaño |
| --- | --- |
| `favicon.svg` | vectorial |
| `favicon.ico` | 16, 32 y 48 |
| `favicon-16.png` · `favicon-32.png` · `favicon-48.png` | 16, 32 y 48 |
| `apple-touch-icon.png` | 180, a sangre |
| `icon-192.png` · `icon-512.png` | 192 y 512, a sangre |
| `icon-maskable-512.png` | 512 con zona segura |

Los manifiestos cambian de nombre, no de iconos:

| App | `name` | `short_name` | `start_url` |
| --- | --- | --- | --- |
| `web-comensal` | Tuki — La mesa se comparte | Tuki | `/` |
| `panel-restaurante` | Tuki — Panel del restaurante | Tuki Panel | `/panel` |
| `admin-plataforma` | Tuki — Administración | Tuki Admin | `/admin` |

Las tres `index.html` enlazan `favicon.ico`, `favicon.svg`,
`apple-touch-icon.png`, `manifest.webmanifest` y declaran
`theme-color="#C2410C"`.

## 5. Lo que no se hace

- No se separa la llama del tablero: sin la unión deja de ser una llama
  encendida en la mesa.
- No se convierte la llama en estrella, destello ni chispa de cuatro puntas.
- No se añaden platos, cubiertos, corazones, humo ni adornos.
- No se rellena la llama de otro color ni se le pone contorno.
- No se usan degradados, sombras, biseles ni texturas dentro de la marca.
- No se rota, inclina, estira ni comprime.
- No se usa la marca como logo de un restaurante.
- No se escribe «TUKI» en mayúsculas ni se traduce el nombre.
- No se pone sobre una foto sin baldosa o velo sólido.

## 6. Verificación

```bash
pnpm --dir v2 typecheck
pnpm --dir v2 --filter web-comensal build
pnpm --dir v2 --filter panel-restaurante build
pnpm --dir v2 --filter admin-plataforma build
```

Además, revisión visual de la pestaña a 16 px, de la barra de Descubrir a 1440
px en claro y oscuro, y de la baldosa a 32 px. Las capturas de la verificación
están en `tukituki-2026/proceso/v2-*.png`.

