import { create } from 'zustand';
import { Platillo } from '../tipos/modelos';

export interface ItemCarrito {
  platillo: Platillo;
  cantidad: number;
  /**
   * Solo lo escribe la portada. El menú del restaurante ya sabe de quién es el
   * carrito y no necesita repetirlo.
   */
  restaurante_nombre?: string;
}

/** Un carrito pertenece a un restaurante: no se pueden mezclar pedidos. */
export type ResultadoAgregar = 'ok' | 'otro-restaurante';

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

// Función helper para vibrar fuera de componentes React
const vibrar = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(15);
  }
};

const claveCarrito = (usuarioId: string) => `tuki_carrito_${usuarioId}`;

const esItemValido = (valor: unknown): valor is ItemCarrito => {
  if (!valor || typeof valor !== 'object') return false;
  const item = valor as ItemCarrito;
  return Boolean(
    item.platillo &&
      typeof item.platillo.id === 'string' &&
      typeof item.platillo.nombre === 'string' &&
      typeof item.platillo.precio === 'number' &&
      typeof item.platillo.restaurante_id === 'string' &&
      typeof item.cantidad === 'number' &&
      item.cantidad > 0
  );
};

export const useStoreCarrito = create<CarritoState>((set, get) => ({
  carrito: [],
  modalAbierto: false,

  setModalAbierto: (abierto) => set({ modalAbierto: abierto }),

  agregarItem: (platillo, restauranteNombre) => {
    const { carrito } = get();

    // El pedido va a un solo restaurante. El llamador decide si reemplaza.
    if (carrito.length > 0 && carrito[0].platillo.restaurante_id !== platillo.restaurante_id) {
      return 'otro-restaurante';
    }

    vibrar(); // Feedback háptico
    set((state) => {
      const existe = state.carrito.find((p) => p.platillo.id === platillo.id);
      if (existe) {
        return {
          carrito: state.carrito.map((p) =>
            p.platillo.id === platillo.id
              ? {
                  ...p,
                  cantidad: p.cantidad + 1,
                  restaurante_nombre: p.restaurante_nombre ?? restauranteNombre,
                }
              : p
          ),
        };
      }
      return {
        carrito: [...state.carrito, { platillo, cantidad: 1, restaurante_nombre: restauranteNombre }],
      };
    });

    return 'ok';
  },

  reemplazarCarrito: (platillo, restauranteNombre) => {
    vibrar();
    set({ carrito: [{ platillo, cantidad: 1, restaurante_nombre: restauranteNombre }] });
  },

  actualizarCantidad: (id, delta) => set((state) => ({
    carrito: state.carrito.map(item => {
      if (item.platillo.id === id) {
        const nuevaCant = item.cantidad + delta;
        if (delta > 0) vibrar(); // Solo vibrar al aumentar
        return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : item;
      }
      return item;
    })
  })),

  eliminarItem: (id) => set((state) => ({
    carrito: state.carrito.filter(item => item.platillo.id !== id)
  })),

  calcularTotal: () => {
    const { carrito } = get();
    return carrito.reduce((acc, item) => acc + (item.platillo.precio * item.cantidad), 0);
  },

  vaciarCarrito: () => set({ carrito: [] }),

  hidratar: (usuarioId) => {
    try {
      const crudo = localStorage.getItem(claveCarrito(usuarioId));
      const datos = crudo ? JSON.parse(crudo) : [];
      const items = Array.isArray(datos) ? datos.filter(esItemValido) : [];
      set({ carrito: items });
    } catch {
      set({ carrito: [] });
    }
  },

  persistir: (usuarioId) => {
    try {
      localStorage.setItem(claveCarrito(usuarioId), JSON.stringify(get().carrito));
    } catch {
      // Sin almacenamiento (modo privado lleno) el carrito sigue en memoria.
    }
  },

  reiniciar: () => set({ carrito: [], modalAbierto: false }),
}));
