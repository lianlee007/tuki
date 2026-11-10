/**
 * Descripción: modelo único del estado de un platillo.
 *
 * En la base de datos un platillo guarda dos booleanos (`disponible` y
 * `visible`), que dan cuatro combinaciones. Al dueño le importan tres estados,
 * así que aquí se traducen en un solo sitio para que el gestor de menú y el
 * editor digan exactamente lo mismo.
 */
import { Platillo } from '../../../tipos';

export type EstadoPlatillo = 'disponible' | 'agotado' | 'oculto';

export interface DefinicionEstado {
  id: EstadoPlatillo;
  nombre: string;
  /** Qué significa, en las palabras del dueño. */
  descripcion: string;
}

export const ESTADOS: DefinicionEstado[] = [
  {
    id: 'disponible',
    nombre: 'Disponible',
    descripcion: 'Se ve en el menú y se puede pedir.',
  },
  {
    id: 'agotado',
    nombre: 'Agotado',
    descripcion: 'Sigue en el menú, pero marcado como agotado.',
  },
  {
    id: 'oculto',
    nombre: 'Oculto',
    descripcion: 'No aparece en el menú mientras esté así.',
  },
];

export const definicionEstado = (estado: EstadoPlatillo): DefinicionEstado =>
  ESTADOS.find((e) => e.id === estado) ?? ESTADOS[0];

/** Estado que le corresponde a un platillo guardado. */
export const estadoDe = (p: Pick<Platillo, 'disponible' | 'visible'>): EstadoPlatillo =>
  !p.visible ? 'oculto' : p.disponible ? 'disponible' : 'agotado';

/**
 * Traduce un estado a los dos booleanos que guarda la base de datos.
 *
 * "Oculto" no toca `disponible` a propósito: si un plato estaba agotado y se
 * oculta, al volver a mostrarlo sigue agotado. Esconder un plato no es una
 * forma de decir que ya hay existencia.
 */
export const camposDeEstado = (
  estado: EstadoPlatillo,
  actual: Pick<Platillo, 'disponible'>,
): { disponible: boolean; visible: boolean } => {
  if (estado === 'oculto') return { disponible: actual.disponible, visible: false };
  return { disponible: estado === 'disponible', visible: true };
};

/** Recuento por estado, para el resumen del gestor de menú. */
export const contarEstados = (platillos: Platillo[]) => {
  const conteo = { total: platillos.length, disponible: 0, agotado: 0, oculto: 0, destacado: 0 };
  for (const p of platillos) {
    conteo[estadoDe(p)] += 1;
    if (p.destacado) conteo.destacado += 1;
  }
  return conteo;
};
