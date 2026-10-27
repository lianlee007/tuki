/**
 * Utilidades de color para el tema del restaurante.
 *
 * Una misma paleta debe verse bien en claro y en oscuro, y debe ser legible por
 * muchos restaurantes distintos (incluidos temas heredados con colores poco
 * afortunados). Por eso todo se deriva aquí a partir de dos colores base: el
 * fondo y el texto. Las superficies, bordes, texto secundario y precios se
 * calculan automáticamente y se corrigen si no alcanzan un contraste mínimo.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Convierte un hex (#RGB o #RRGGBB) a sus canales. Devuelve negro si es inválido. */
export function hexARgb(hex: string): RGB {
  let h = (hex || '').trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Devuelve "r g b" (formato de canal CSS, para rgb(var(--x) / <alpha>)). */
export function rgbTriplet(hex: string): string {
  const { r, g, b } = hexARgb(hex);
  return `${r} ${g} ${b}`;
}

const aHex = ({ r, g, b }: RGB) => `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;

/** Mezcla `hex` hacia `destino` en una proporción 0..1 y devuelve un hex. */
export function mezclar(hex: string, destino: string, cantidad: number): string {
  const a = hexARgb(hex);
  const b = hexARgb(destino);
  const t = Math.max(0, Math.min(1, cantidad));
  return aHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
}

/** Luminancia relativa (0..1). */
export function luminancia(hex: string): number {
  const { r, g, b } = hexARgb(hex);
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Relación de contraste WCAG entre dos colores (1..21). */
export function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Color de texto con mayor contraste sobre un fondo (blanco o casi negro). */
export function textoSobre(hex: string): '#FFFFFF' | '#111111' {
  return contraste('#FFFFFF', hex) >= contraste('#111111', hex) ? '#FFFFFF' : '#111111';
}

/* -------------------------------------------------------------------------
   HSL: para derivar el modo oscuro sin perder la personalidad de la paleta.
   Mezclar hacia blanco/negro apaga el color (un dorado acaba gris). Fijando la
   luminosidad y conservando tono y saturación, el modo oscuro hereda el mismo
   carácter que eligió el restaurante.
   ------------------------------------------------------------------------- */

function rgbAHSL(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexARgb(hex);
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: Math.min(1, Math.max(0, s)), l };
}

function hslARGB(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rp = 0, gp = 0, bp = 0;
  if (h < 60) { rp = c; gp = x; }
  else if (h < 120) { rp = x; gp = c; }
  else if (h < 180) { gp = c; bp = x; }
  else if (h < 240) { gp = x; bp = c; }
  else if (h < 300) { rp = x; bp = c; }
  else { rp = c; bp = x; }
  return { r: (rp + m) * 255, g: (gp + m) * 255, b: (bp + m) * 255 };
}

/**
 * Fija la luminosidad conservando tono y saturación. Se usa para construir el
 * modo oscuro a partir de la paleta clara cuando la base de datos no guarda
 * colores oscuros explícitos: el fondo se vuelve un negro tintado de la propia
 * paleta y el acento un tono claro del mismo color.
 */
export function conLuminosidad(hex: string, l: number): string {
  const { h, s } = rgbAHSL(hex);
  return aHex(hslARGB(h, s, Math.max(0, Math.min(1, l))));
}

/** Fuerza un color hasta alcanzar el contraste mínimo contra `fondo`. */
export function tonoLegible(color: string, fondo: string, minimo = 4.5, destino?: string): string {
  if (contraste(color, fondo) >= minimo) return color;
  const hacia = destino ?? (luminancia(fondo) > 0.5 ? '#000000' : '#FFFFFF');
  for (let i = 1; i <= 10; i++) {
    const c = mezclar(color, hacia, i * 0.1);
    if (contraste(c, fondo) >= minimo) return c;
  }
  return textoSobre(fondo);
}

/**
 * Si el color no alcanza el contraste mínimo, salta directamente al mejor
 * contraste posible (blanco o casi negro). Se usa para el texto principal y los
 * títulos, donde no queremos quedarnos en un gris intermedio.
 */
export function asegurarContraste(color: string, fondo: string, minimo = 4.5): string {
  return contraste(color, fondo) >= minimo ? color : textoSobre(fondo);
}

export interface PaletaBase {
  bg: string;
  text: string;
  title: string;
  primary: string;
  secondary: string;
}

export interface PaletaDerivada extends PaletaBase {
  onPrimary: '#FFFFFF' | '#111111';
  onSecondary: '#FFFFFF' | '#111111';
  onSuccess: '#FFFFFF' | '#111111';
  surface: string;
  cardBg: string;
  muted: string;
  border: string;
  precio: string;
  bgEsOscuro: boolean;

  /* --- Capa semántica -------------------------------------------------------
     El color de marca (primario/secundario) casi nunca es legible tal cual:
     un amarillo, un dorado o un turquesa sobre blanco desaparecen, y un azul
     marino sobre negro desaparece en oscuro. Estas variantes son el mismo color
     llevado al contraste mínimo exigible. Las plantillas deben usar SIEMPRE
     estas y no `primary`/`secondary` cuando el color vaya a ser texto, un tinte
     o una línea sobre el fondo. */
  accentText: string;      // primario legible como texto
  accentSoft: string;      // primario como fondo teñido suave (chips)
  accentLine: string;      // primario como línea decorativa (visible)
  /* Relleno sólido (botón/chip) con etiqueta blanca. Es un token APARTE de
     `accentText` porque en un fondo oscuro no existe un color que sirva a la vez
     para las dos cosas: el texto necesita ser claro y el relleno con blanco
     encima necesita ser oscuro. Este es el color de marca oscurecido lo justo
     para que el blanco cumpla 4.5:1. */
  accentSolid: string;
  secondaryText: string;   // secundario legible como texto
  secondarySoft: string;
  danger: string;          // rojo adaptado a claro y oscuro (alertas, agotado)
  dangerSoft: string;
  success: string;         // verde adaptado a claro y oscuro (abierto, listo)
  successSoft: string;
}

/**
 * Deriva todos los colores de la interfaz a partir del fondo y el texto de la
 * paleta. No depende de si el visitante activó el modo claro u oscuro: se basa
 * en la luminancia real del fondo, así que funciona con cualquier combinación.
 */
export function derivarPaleta(p: PaletaBase): PaletaDerivada {
  const { bg, primary, secondary } = p;
  const bgEsOscuro = luminancia(bg) < 0.4;
  const hacia = bgEsOscuro ? '#FFFFFF' : '#000000';

  const surface = mezclar(bg, hacia, bgEsOscuro ? 0.10 : 0.05);
  const cardBg = bgEsOscuro ? mezclar(bg, '#FFFFFF', 0.07) : mezclar(bg, '#FFFFFF', 0.65);
  const border = mezclar(bg, hacia, bgEsOscuro ? 0.20 : 0.13);

  // Todas las tintas se corrigen contra `surface`, no contra `bg`: `surface` es
  // el escalón que se mueve hacia `hacia` y por tanto es siempre la superficie
  // que deja menos contraste (más oscura en claro, más clara en oscuro). Si el
  // color pasa ahí, pasa también sobre el fondo y sobre las tarjetas.
  const text = asegurarContraste(p.text, surface, 4.5);
  const title = asegurarContraste(p.title, surface, 3);
  const muted = tonoLegible(mezclar(p.text, bg, 0.42), surface, 4.5, text);

  // Un chip es texto del color de marca sobre un tinte de ese mismo color, y el
  // tinte es intrínsecamente más exigente que la superficie desnuda. Por eso la
  // tinta se corrige CONTRA su propio tinte: así cumple sobre el chip y, con
  // más holgura, sobre el fondo y las tarjetas.
  const accentSoft = mezclar(surface, primary, 0.13);
  const secondarySoft = mezclar(surface, secondary, 0.13);
  const dangerSoft = mezclar(surface, '#DC2626', 0.13);
  const successSoft = mezclar(surface, '#16A34A', 0.13);

  const accentText = tonoLegible(primary, accentSoft, 4.5, hacia);
  const secondaryText = tonoLegible(secondary, secondarySoft, 4.5, hacia);
  const danger = tonoLegible('#DC2626', dangerSoft, 4.5, hacia);
  const success = tonoLegible('#16A34A', successSoft, 4.5, hacia);
  // El relleno se corrige hacia negro (no hacia `hacia`): siempre lleva blanco
  // encima, así que su límite es el mismo en claro y en oscuro.
  const accentSolid = tonoLegible(primary, '#FFFFFF', 4.5, '#000000');

  return {
    bg, text, title, primary, secondary,
    onPrimary: textoSobre(primary),
    onSecondary: textoSobre(secondary),
    onSuccess: textoSobre(success),
    surface, cardBg, muted, border, precio: accentText, bgEsOscuro,

    accentText,
    accentSoft,
    accentLine: tonoLegible(primary, surface, 2.2, hacia),
    accentSolid,
    secondaryText,
    secondarySoft,
    danger,
    dangerSoft,
    success,
    successSoft,
  };
}

/**
 * Variables CSS que hacen que toda la interfaz (clases af-*) use la paleta del
 * restaurante. Se aplican en el contenedor de la plantilla y también en los
 * modales, que se montan por portal fuera de ese contenedor.
 */
export function variablesAf(p: PaletaBase): Record<string, string> {
  const d = derivarPaleta(p);
  const accentHover = mezclar(d.primary, d.bgEsOscuro ? '#FFFFFF' : '#000000', 0.16);
  return {
    '--af-ground-rgb': rgbTriplet(d.bg),
    '--af-surface-rgb': rgbTriplet(d.surface),
    '--af-ink-rgb': rgbTriplet(d.text),
    '--af-ink-secondary-rgb': rgbTriplet(d.muted),
    '--af-accent-rgb': rgbTriplet(d.primary),
    '--af-accent-hover-rgb': rgbTriplet(accentHover),
    // El acento legible como texto. `--af-accent-rgb` es el color de marca puro
    // (para fondos de botón); este es el mismo color corregido para leerse
    // encima del fondo, en claro y en oscuro.
    '--af-accent-text-rgb': rgbTriplet(d.accentText),
    '--af-accent-soft-rgb': rgbTriplet(d.accentSoft),
    // Relleno sólido con etiqueta blanca: el mismo color de marca oscurecido lo
    // justo para que el blanco encima cumpla 4.5:1 (un amarillo de marca con
    // texto blanco, si no, desaparece).
    '--af-accent-solid-rgb': rgbTriplet(d.accentSolid),
    '--af-accent-solid-hover-rgb': rgbTriplet(mezclar(d.accentSolid, '#000000', 0.12)),
    '--af-border-rgb': rgbTriplet(d.border),
    // Semánticos: dentro del restaurante se adaptan a su paleta y a su modo, de
    // modo que una alerta o un "agotado" sea legible en ambos.
    '--af-danger-rgb': rgbTriplet(d.danger),
    '--af-success-rgb': rgbTriplet(d.success),
    // Aliases heredados (tokens de index.html) para no romper nada existente
    '--bg-color': d.bg,
    '--surface-color': d.surface,
    '--text-main': d.text,
    '--text-muted': d.muted,
    '--user-primary': d.primary,
    '--user-secondary': d.secondary,
  };
}

/** Modo del panel del dueño (el del sistema, no el de la página del restaurante). */
export type ModoPanel = 'claro' | 'oscuro';

/**
 * El contexto de tema habla en `'light'`/`'dark'` y aquí se habla en
 * `'claro'`/`'oscuro'`. Se aceptan las dos grafías a propósito: cuando cada
 * sitio traducía a mano, bastaba con pasar `'dark'` donde se esperaba
 * `'oscuro'` para que el panel se derivara siempre con la rama clara y el
 * acento quedara oscuro sobre fondo oscuro (ilegible al pasar el ratón).
 */
export type ModoPantalla = ModoPanel | 'light' | 'dark';

const esOscuro = (modo: ModoPantalla) => modo === 'oscuro' || modo === 'dark';

/** Las dos superficies reales del panel, las que el dueño tiene delante. */
const SUPERFICIE_PANEL: Record<ModoPanel, string> = { claro: '#F2F2F7', oscuro: '#1C1C1E' };

/**
 * Acento del PANEL a partir del color de marca del restaurante.
 *
 * El panel no cambia de papel ni de tinta —sigue sobre la superficie neutra de
 * siempre—, sólo el acento: botones, pestañas activas, focos, tintes y precios.
 * Así el dueño reconoce su color en toda la herramienta, no sólo en su página.
 *
 * Se corrige contra las superficies REALES del panel y no contra las de la
 * plantilla: un paleta crema y el #F2F2F7 del panel se parecen, pero no son lo
 * mismo, y aquí lo que tiene que ser legible es lo que hay en pantalla. El
 * relleno se corrige aparte porque lleva blanco encima (mismo criterio que en
 * `derivarPaleta`): ningún color sirve a la vez de tinta y de relleno oscuro.
 */
export function acentoPanel(marca: string, modo: ModoPantalla): Record<string, string> {
  const oscuro = esOscuro(modo);
  const superficie = SUPERFICIE_PANEL[oscuro ? 'oscuro' : 'claro'];
  const hacia = oscuro ? '#FFFFFF' : '#000000';
  // La tinta se corrige contra su propio tinte (el chip), que es el caso más
  // exigente; si pasa ahí, pasa también sobre la superficie desnuda. Mismo
  // criterio que en `derivarPaleta`.
  const suave = mezclar(superficie, marca, 0.13);
  const texto = tonoLegible(marca, suave, 4.5, hacia);
  const solido = tonoLegible(marca, '#FFFFFF', 4.5, '#000000');

  return {
    '--af-accent-rgb': rgbTriplet(texto),
    '--af-accent-text-rgb': rgbTriplet(texto),
    '--af-accent-hover-rgb': rgbTriplet(mezclar(texto, hacia, 0.16)),
    '--af-accent-soft-rgb': rgbTriplet(suave),
    '--af-accent-solid-rgb': rgbTriplet(solido),
    '--af-accent-solid-hover-rgb': rgbTriplet(mezclar(solido, '#000000', 0.12)),
  };
}

/** Dónde recuerda el navegador el acento del panel entre recargas. */
const CLAVE_ACENTO = 'tuki_acento';

interface AcentoGuardado {
  /** Dueño del acento. El de otra sesión no se aplica nunca. */
  uid: string;
  claro: Record<string, string>;
  oscuro: Record<string, string>;
}

/**
 * Guarda en el navegador el acento del panel ya calculado, para los dos modos.
 *
 * El acento sale del tema del restaurante, que llega por la red una petición
 * después que el restaurante. En ese hueco el panel ya está en pantalla y sin
 * esto se pintaba con el acento de serie, así que al recargar se veía un
 * fogonazo del color por defecto y un salto al color del dueño.
 *
 * Se guardan las variables ya resueltas y no el color de marca para no repetir
 * fuera de aquí la corrección de contraste: `acentoPanel` es el único sitio que
 * decide cómo un color de marca se vuelve legible sobre las superficies del
 * panel, y duplicar esa cuenta en otro lenguaje sería garantizar que se separen.
 */
export function recordarAcento(uid: string, marca: { claro: string; oscuro: string }): void {
  try {
    const acento: AcentoGuardado = {
      uid,
      claro: acentoPanel(marca.claro, 'claro'),
      oscuro: acentoPanel(marca.oscuro, 'oscuro'),
    };
    localStorage.setItem(CLAVE_ACENTO, JSON.stringify(acento));
  } catch { /* sin almacenamiento: se verá el acento de serie un instante */ }
}

/**
 * El acento recordado, sólo si es del usuario que tiene la sesión abierta.
 *
 * Devolver el de otra persona sería peor que no devolver nada: pintaría el panel
 * de un color ajeno justo en el hueco que esto viene a tapar. Si el modo pedido
 * no está, o lo guardado no tiene la forma esperada, tampoco se devuelve nada:
 * quien llama decide entonces qué poner, en vez de recibir algo a medias.
 */
export function acentoRecordado(uid: string | undefined, modo: ModoPantalla): Record<string, string> | undefined {
  if (!uid) return undefined;
  try {
    const crudo = localStorage.getItem(CLAVE_ACENTO);
    if (!crudo) return undefined;
    const acento = JSON.parse(crudo) as AcentoGuardado;
    if (!acento || acento.uid !== uid) return undefined;
    const variables = esOscuro(modo) ? acento.oscuro : acento.claro;
    return variables && typeof variables === 'object' ? variables : undefined;
  } catch {
    return undefined;
  }
}
