import type { EstiloPlantilla } from '../../tipos';

/**
 * El marco de la página pública.
 *
 * Las nueve estructuras no se diferencian solo en cómo listan los platos: cada
 * una tiene una portada, una navegación, una franja de información y un pie
 * propios. Este mapa es la única fuente de esas decisiones, para que la vista
 * pública y las miniaturas del panel enseñen exactamente lo mismo.
 */
export type PortadaId =
  | 'clasico'
  | 'editorial'
  | 'tipografico'
  | 'bento'
  | 'inmersivo'
  | 'vitrina'
  | 'mosaico'
  | 'diptico'
  | 'compacta';

export type NavId = 'barra' | 'flotante' | 'minima' | 'cristal';
export type InfoId = 'tarjeta' | 'linea' | 'oscura' | 'oculta';
export type PieId = 'clasico' | 'editorial' | 'minimo' | 'marca';
export type PatronId = 'ninguno' | 'puntos' | 'lineas';

export interface Marco {
  portada: PortadaId;
  nav: NavId;
  info: InfoId;
  pie: PieId;
  patron: PatronId;
  /** El buscador del menú solo donde no rompe la composición. */
  buscador: boolean;
}

export const MARCOS: Record<EstiloPlantilla, Marco> = {
  moderno: { portada: 'clasico', nav: 'barra', info: 'tarjeta', pie: 'clasico', patron: 'ninguno', buscador: true },
  carta: { portada: 'editorial', nav: 'minima', info: 'linea', pie: 'editorial', patron: 'lineas', buscador: true },
  minimalista: { portada: 'tipografico', nav: 'minima', info: 'oculta', pie: 'minimo', patron: 'ninguno', buscador: true },
  grid: { portada: 'bento', nav: 'flotante', info: 'linea', pie: 'editorial', patron: 'puntos', buscador: true },
  inmersivo: { portada: 'inmersivo', nav: 'cristal', info: 'oculta', pie: 'minimo', patron: 'ninguno', buscador: true },
  vitrina: { portada: 'vitrina', nav: 'flotante', info: 'linea', pie: 'clasico', patron: 'ninguno', buscador: true },
  mosaico: { portada: 'mosaico', nav: 'barra', info: 'oculta', pie: 'editorial', patron: 'puntos', buscador: true },
  diptico: { portada: 'diptico', nav: 'minima', info: 'linea', pie: 'editorial', patron: 'ninguno', buscador: true },
  compacta: { portada: 'compacta', nav: 'barra', info: 'linea', pie: 'minimo', patron: 'ninguno', buscador: true },
};

/** Patrón de fondo, dibujado con gradientes (sin imágenes ni peticiones). */
export const fondoPatron = (patron: PatronId, color: string): string | undefined => {
  if (patron === 'puntos') {
    return `radial-gradient(circle at 1px 1px, ${color} 1px, transparent 0)`;
  }
  if (patron === 'lineas') {
    return `repeating-linear-gradient(0deg, ${color} 0 1px, transparent 1px 34px)`;
  }
  return undefined;
};
