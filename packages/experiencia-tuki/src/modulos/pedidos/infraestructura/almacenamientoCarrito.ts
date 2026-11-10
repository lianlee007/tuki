/**
 * Adaptador de persistencia del carrito sobre `localStorage`.
 *
 * La capa de aplicación solo ve `leer` y `escribir`; si mañana el carrito se
 * guarda en Supabase o en IndexedDB, se cambia este archivo y nada más.
 * Un fallo de almacenamiento nunca rompe la compra: se degrada a memoria.
 */
import { claveCarrito, sanearCarrito, type ItemCarrito } from '../dominio/carrito';

const disponible = (): boolean =>
  typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined';

export const almacenamientoCarrito = {
  leer(usuarioId: string): ItemCarrito[] {
    if (!disponible()) return [];
    try {
      const crudo = globalThis.localStorage.getItem(claveCarrito(usuarioId));
      return sanearCarrito(crudo ? JSON.parse(crudo) : []);
    } catch {
      return [];
    }
  },

  escribir(usuarioId: string, carrito: ItemCarrito[]): void {
    if (!disponible()) return;
    try {
      globalThis.localStorage.setItem(claveCarrito(usuarioId), JSON.stringify(carrito));
    } catch {
      // Sin almacenamiento (modo privado lleno) el carrito sigue en memoria.
    }
  },
};
