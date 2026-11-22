/**
 * Descripción: contrato único de los arquetipos de menú.
 *
 * Antes cada plantilla declaraba su propia forma de props y el shell tenía que
 * adaptar los datos en cada rama. Dos plantillas (Minimal y Editorial) ni
 * siquiera recibían `refs`, así que el seguimiento de secciones de la barra
 * superior no funcionaba en ellas. Con una sola forma, el shell monta cualquier
 * estructura con los mismos datos y ninguna pierde comportamiento.
 */
import type { MouseEvent, MutableRefObject } from 'react';
import type { Platillo } from '../../../tipos';
import type { PaletaDerivada } from '../../../lib/color';

/** Colores y medidas ya resueltas que consume cualquier arquetipo de menú. */
export type EstilosComunes = PaletaDerivada & {
  /** Borde de tarjeta como valor listo para usar. */
  cardBorder: string;
  /** Sombra de hover de tarjeta (el reposo no lleva sombra). */
  cardHoverShadow: string;
  isDark: boolean;
  /** Familias elegidas por el dueño, para los modales que se montan por portal. */
  fuenteTitulos: string;
  fuenteCuerpo: string;
};

export interface PlantillaMenuProps {
  /** Nombres de categoría, en el orden en que se deben mostrar. */
  categorias: string[];
  /** Platillos agrupados por nombre de categoría. */
  menuPorCategoria: Record<string, Platillo[]>;
  /** Capa semántica de color del tema (nunca usar primary/secondary crudos). */
  estilos: EstilosComunes;
  /** El shell publica aquí el nodo de cada sección para el seguimiento del scroll. */
  refs: MutableRefObject<Record<string, HTMLElement | null>>;
  onVerPlatillo: (p: Platillo) => void;
  onAgregarAlCarrito: (p: Platillo, e?: MouseEvent) => void;
  /** Si el local está cerrado, los botones de pedido quedan desactivados. */
  localAbierto: boolean;
}
