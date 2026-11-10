/**
 * Reglas del carrito, sin React, sin Zustand y sin `localStorage`.
 *
 * El carrito pertenece a un solo restaurante y sobrevive a la recarga para los
 * comensales autenticados. Estas funciones son el núcleo del módulo `pedidos`:
 * la capa de aplicación (`aplicacion/storeCarrito.ts`) las orquesta y la de
 * infraestructura (`infraestructura/almacenamientoCarrito.ts`) las persiste.
 * Al ser funciones puras se prueban sin navegador ni mocks.
 */
import type { Platillo } from '../../../tipos/modelos';

export interface ItemCarrito {
  platillo: Platillo;
  cantidad: number;
  /**
   * Solo lo escribe la portada. El menú del restaurante ya sabe de quién es el
   * carrito y no necesita repetirlo.
   */
  restaurante_nombre?: string;
}

export type ResultadoAgregar = 'ok' | 'otro-restaurante';

/**
 * Un pedido va a un solo restaurante: si el carrito ya tiene otro, el llamador
 * decide si lo reemplaza. La función no muta la lista recibida.
 */
export const agregarItem = (
  carrito: ItemCarrito[],
  platillo: Platillo,
  restauranteNombre?: string,
): { carrito: ItemCarrito[]; resultado: ResultadoAgregar } => {
  if (carrito.length > 0 && carrito[0].platillo.restaurante_id !== platillo.restaurante_id) {
    return { carrito, resultado: 'otro-restaurante' };
  }

  const existe = carrito.find((item) => item.platillo.id === platillo.id);
  if (existe) {
    return {
      carrito: carrito.map((item) =>
        item.platillo.id === platillo.id
          ? {
              ...item,
              cantidad: item.cantidad + 1,
              restaurante_nombre: item.restaurante_nombre ?? restauranteNombre,
            }
          : item,
      ),
      resultado: 'ok',
    };
  }

  return {
    carrito: [...carrito, { platillo, cantidad: 1, restaurante_nombre: restauranteNombre }],
    resultado: 'ok',
  };
};

/** Bajar de cero no elimina el item; para eso está `quitarItem`. */
export const cambiarCantidad = (
  carrito: ItemCarrito[],
  id: string,
  delta: number,
): ItemCarrito[] =>
  carrito.map((item) => {
    if (item.platillo.id !== id) return item;
    const nuevaCantidad = item.cantidad + delta;
    return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : item;
  });

export const quitarItem = (carrito: ItemCarrito[], id: string): ItemCarrito[] =>
  carrito.filter((item) => item.platillo.id !== id);

export const totalCarrito = (carrito: ItemCarrito[]): number =>
  carrito.reduce((total, item) => total + item.platillo.precio * item.cantidad, 0);

/** Clave de almacenamiento por usuario: dos cuentas no comparten carrito. */
export const claveCarrito = (usuarioId: string) => `tuki_carrito_${usuarioId}`;

/**
 * Un carrito guardado puede venir de una versión anterior del menú o estar
 * manipulado. Se descarta lo que no tenga la forma mínima esperada.
 */
export const esItemCarritoValido = (valor: unknown): valor is ItemCarrito => {
  if (!valor || typeof valor !== 'object') return false;
  const item = valor as ItemCarrito;
  return Boolean(
    item.platillo &&
      typeof item.platillo.id === 'string' &&
      typeof item.platillo.nombre === 'string' &&
      typeof item.platillo.precio === 'number' &&
      typeof item.platillo.restaurante_id === 'string' &&
      typeof item.cantidad === 'number' &&
      item.cantidad > 0,
  );
};

export const sanearCarrito = (valor: unknown): ItemCarrito[] =>
  Array.isArray(valor) ? valor.filter(esItemCarritoValido) : [];
