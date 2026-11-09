/**
 * Estado del carrito para la interfaz.
 *
 * Es la capa de aplicación del módulo: orquesta las reglas puras de
 * `../dominio/carrito.ts`, el adaptador de `../infraestructura` y expone el
 * estado que consumen los componentes. No contiene reglas del negocio; si una
 * decisión puede probarse sin React, vive en el dominio.
 */
import { create } from 'zustand';
import type { Platillo } from '../../../tipos/modelos';
import {
  agregarItem,
  cambiarCantidad,
  quitarItem,
  totalCarrito,
  type ItemCarrito,
  type ResultadoAgregar,
} from '../dominio/carrito';
import { almacenamientoCarrito } from '../infraestructura/almacenamientoCarrito';

interface CarritoState {
  carrito: ItemCarrito[];
  modalAbierto: boolean;
  setModalAbierto: (abierto: boolean) => void;
  agregarItem: (platillo: Platillo, restauranteNombre?: string) => ResultadoAgregar;
  reemplazarCarrito: (platillo: Platillo, restauranteNombre?: string) => void;
  actualizarCantidad: (id: string, delta: number) => void;
  eliminarItem: (id: string) => void;
  calcularTotal: () => number;
  vaciarCarrito: () => void;
  /** Lee el carrito guardado del comensal; se llama al iniciar sesión. */
  hidratar: (usuarioId: string) => void;
  /** Escribe el carrito del comensal; lo hace un suscriptor en App. */
  persistir: (usuarioId: string) => void;
  /** Al cerrar sesión o cambiar de cuenta no se arrastra el carrito de nadie. */
  reiniciar: () => void;
}

// Feedback háptico: es un efecto de interfaz, no una regla del carrito.
const vibrar = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(15);
  }
};

export const useStoreCarrito = create<CarritoState>((set, get) => ({
  carrito: [],
  modalAbierto: false,

  setModalAbierto: (abierto) => set({ modalAbierto: abierto }),

  agregarItem: (platillo, restauranteNombre) => {
    const { carrito, resultado } = agregarItem(get().carrito, platillo, restauranteNombre);
    if (resultado === 'otro-restaurante') return resultado;

    vibrar();
    set({ carrito });
    return resultado;
  },

  reemplazarCarrito: (platillo, restauranteNombre) => {
    vibrar();
    set({ carrito: [{ platillo, cantidad: 1, restaurante_nombre: restauranteNombre }] });
  },

  actualizarCantidad: (id, delta) => {
    if (delta > 0) vibrar(); // Solo vibrar al aumentar
    set((state) => ({ carrito: cambiarCantidad(state.carrito, id, delta) }));
  },

  eliminarItem: (id) =>
    set((state) => ({ carrito: quitarItem(state.carrito, id) })),

  calcularTotal: () => totalCarrito(get().carrito),

  vaciarCarrito: () => set({ carrito: [] }),

  hidratar: (usuarioId) => set({ carrito: almacenamientoCarrito.leer(usuarioId) }),

  persistir: (usuarioId) => almacenamientoCarrito.escribir(usuarioId, get().carrito),

  reiniciar: () => set({ carrito: [], modalAbierto: false }),
}));
