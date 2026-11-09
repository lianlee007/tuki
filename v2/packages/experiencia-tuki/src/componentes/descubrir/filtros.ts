/**
 * Los filtros de Descubrir, en un solo sitio para que la página, el panel y
 * las pastillas de filtros activos digan exactamente lo mismo.
 */

export const RANGOS_PRECIO = {
  bajo: { etiqueta: 'Hasta $15.000', min: undefined, max: 15000 },
  medio: { etiqueta: '$15.000 – $30.000', min: 15000, max: 30000 },
  alto: { etiqueta: 'Más de $30.000', min: 30000, max: undefined },
} as const;

export type ClavePrecio = keyof typeof RANGOS_PRECIO;

export const DIETAS = [
  { clave: 'vegetariano', etiqueta: 'Vegetariano' },
  { clave: 'vegano', etiqueta: 'Vegano' },
  { clave: 'picante', etiqueta: 'Picante' },
] as const;

export type ClaveDieta = (typeof DIETAS)[number]['clave'];

export const esClavePrecio = (valor: string): valor is ClavePrecio =>
  valor in RANGOS_PRECIO;

export const esClaveDieta = (valor: string): valor is ClaveDieta =>
  DIETAS.some((dieta) => dieta.clave === valor);
