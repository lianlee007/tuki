/**
 * Clases compartidas de «Warm Culinary Hearth».
 *
 * La portada de Descubrir vive en su propia voz visual: papel marfil, terracota
 * tostada y esquinas de cerámica. Estas constantes evitan que cada componente
 * reinvente el mismo botón (y que el modo oscuro se desincronice en uno solo).
 *
 * El modo oscuro no es un negro frío: es un marrón tostado profundo, con la
 * misma calidez del modo claro. Cada par claro/oscuro se declara aquí una vez.
 */

export const FOCO =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hearth-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-hearth-cream dark:focus-visible:ring-hearth-night-terracotta dark:focus-visible:ring-offset-hearth-night';

export const TARJETA =
  'rounded-3xl bg-hearth-card ring-1 ring-hearth-line/70 shadow-warm dark:bg-hearth-night-card dark:ring-white/5 dark:shadow-none';

export const TARJETA_INTERACTIVA = `${TARJETA} transition-shadow hover:shadow-warm-lg dark:hover:shadow-warm-dark`;

/** Botón principal: terracota sólido, blanco encima. */
export const BOTON_PRIMARIO = `af-pulsar inline-flex items-center justify-center gap-2 rounded-xl bg-hearth-terracotta-deep px-4 py-2.5 text-sm font-bold text-white shadow-warm transition-colors hover:bg-hearth-terracotta-ink active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-hearth-night-terracotta dark:text-hearth-night dark:hover:bg-[#F6A184] ${FOCO}`;

/** Botón suave: melocotón cremoso con tinta terracota. */
export const BOTON_SUAVE = `af-pulsar inline-flex items-center justify-center gap-2 rounded-xl bg-hearth-terracotta-soft px-4 py-2.5 text-sm font-bold text-hearth-terracotta-ink transition-colors hover:bg-[#FBE2D9] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink dark:hover:bg-[#4A2D24] ${FOCO}`;

/** Botón fantasma: avena tostada, para acciones secundarias. */
export const BOTON_FANTASMA = `af-pulsar inline-flex items-center justify-center gap-2 rounded-xl bg-hearth-oat px-4 py-2.5 text-sm font-semibold text-hearth-espresso transition-colors hover:bg-hearth-oat-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:hover:bg-hearth-night-line ${FOCO}`;

/** Campo de texto: avena en reposo, blanco con halo terracota al enfocar. */
export const CAMPO = `w-full rounded-xl bg-hearth-oat px-4 text-[15px] text-hearth-espresso outline-none transition-colors placeholder:text-hearth-pebble focus:bg-hearth-card focus:ring-2 focus:ring-hearth-terracotta/40 dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:placeholder:text-hearth-night-pebble dark:focus:bg-hearth-night-card dark:focus:ring-hearth-night-terracotta/40`;

export const ETIQUETA =
  'text-[11px] font-extrabold uppercase tracking-[0.14em]';

/** Tinte de la insignia de frescura (vegetariano, vegano). */
export const INSIGNIA_FRESCA =
  'inline-flex items-center gap-1 rounded-full bg-hearth-sage-soft px-2.5 py-1 text-[11px] font-bold text-hearth-sage-ink dark:bg-hearth-night-sage-soft dark:text-hearth-night-sage-ink';

/** Tinte de la insignia cálida (destacado, picante). */
export const INSIGNIA_CALIDA =
  'inline-flex items-center gap-1 rounded-full bg-hearth-honey-soft px-2.5 py-1 text-[11px] font-bold text-hearth-honey-ink dark:bg-hearth-night-honey-soft dark:text-hearth-night-honey-ink';
