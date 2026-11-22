/**
 * Catálogo de parejas tipográficas del panel de diseño.
 *
 * Una pareja es un título con carácter y un cuerpo que se lee sin esfuerzo.
 * Vive aquí, como datos puros, para que la sección de Apariencia y la página
 * pública hablen de las mismas familias.
 *
 * Las fuentes se cargan bajo demanda: en la página del restaurante solo entran
 * las dos que eligió el dueño, y en el panel todas las del catálogo para que
 * las tarjetas se puedan previsualizar de verdad. Si no hay red, el navegador
 * usa la pila de reserva y nada se rompe.
 */

export interface ParFuentes {
  id: string;
  nombre: string;
  etiqueta: string;
  /** Familia de los títulos. */
  titulos: string;
  /** Familia del texto corrido. */
  cuerpo: string;
}

export const PARES_FUENTES: ParFuentes[] = [
  {
    id: 'editorial',
    nombre: 'Clásica',
    etiqueta: 'Editorial y de confianza',
    titulos: 'Playfair Display',
    cuerpo: 'Inter',
  },
  {
    id: 'alta-cocina',
    nombre: 'Alta cocina',
    etiqueta: 'Ligera y refinada',
    titulos: 'Cormorant Garamond',
    cuerpo: 'Jost',
  },
  {
    id: 'boutique',
    nombre: 'Boutique',
    etiqueta: 'Moderna y cálida',
    titulos: 'DM Serif Display',
    cuerpo: 'DM Sans',
  },
  {
    id: 'libro',
    nombre: 'Libro',
    etiqueta: 'De carta impresa',
    titulos: 'Libre Baskerville',
    cuerpo: 'Source Sans 3',
  },
  {
    id: 'romana',
    nombre: 'Romana',
    etiqueta: 'Clásica, con carácter',
    titulos: 'Marcellus',
    cuerpo: 'Karla',
  },
  {
    id: 'artesanal',
    nombre: 'Artesanal',
    etiqueta: 'Cercana y actual',
    titulos: 'Fraunces',
    cuerpo: 'Manrope',
  },
];

/**
 * Pesos que se piden a Google Fonts. Las familias de un solo peso (Marcellus,
 * DM Serif Display…) no llevan `:wght`, porque la API rechaza el pedido entero
 * si se le pide un peso que no existe.
 */
const PESOS: Record<string, string> = {
  'Playfair Display': '400;700;900',
  Inter: '300;400;500;600;700',
  'Cormorant Garamond': '400;600;700',
  Jost: '300;400;500;600',
  'DM Serif Display': '',
  'DM Sans': '400;500;700',
  'Libre Baskerville': '400;700',
  'Source Sans 3': '300;400;600;700',
  Marcellus: '',
  Karla: '400;500;700',
  Fraunces: '400;600;700',
  Manrope: '400;500;700',
};

/** Familias ya pedidas en esta pestaña, para no repetir enlaces. */
const pedidas = new Set<string>();

/**
 * Añade a la página las familias que falten. Se llama al entrar en Apariencia
 * (todas las del catálogo) y al abrir una ficha pública (las dos del tema).
 */
export const cargarFuentes = (familias: (string | null | undefined)[]) => {
  if (typeof document === 'undefined') return;

  const nuevas: string[] = [];
  for (const familia of familias) {
    const nombre = (familia ?? '').trim();
    if (!nombre) continue;
    const clave = nombre.toLowerCase();
    if (pedidas.has(clave) || nuevas.some((n) => n.toLowerCase() === clave)) continue;
    nuevas.push(nombre);
  }
  if (nuevas.length === 0) return;

  const consulta = nuevas
    .map((nombre) => {
      const pesos = PESOS[nombre];
      const familia = nombre.replace(/ /g, '+');
      return pesos ? `family=${familia}:wght@${pesos}` : `family=${familia}`;
    })
    .join('&');

  const enlace = document.createElement('link');
  enlace.rel = 'stylesheet';
  enlace.href = `https://fonts.googleapis.com/css2?${consulta}&display=swap`;
  enlace.dataset.tukiFuentes = 'true';
  document.head.appendChild(enlace);

  nuevas.forEach((nombre) => pedidas.add(nombre.toLowerCase()));
};

/** Carga las dos familias de una pareja. */
export const cargarParFuentes = (par: ParFuentes) => cargarFuentes([par.titulos, par.cuerpo]);

/** Todas las familias del catálogo, para la vista previa del panel. */
export const cargarCatalogoFuentes = () =>
  cargarFuentes(PARES_FUENTES.flatMap((par) => [par.titulos, par.cuerpo]));

/** Pareja activa a partir de lo guardado; `null` si son fuentes heredadas. */
export const parDeTema = (titulos?: string | null, cuerpo?: string | null): ParFuentes | null => {
  const t = (titulos ?? '').trim().toLowerCase();
  const c = (cuerpo ?? '').trim().toLowerCase();
  return PARES_FUENTES.find(
    (par) => par.titulos.toLowerCase() === t && par.cuerpo.toLowerCase() === c,
  ) ?? null;
};
