import { create } from 'zustand';
import { Platillo } from '../tipos/modelos';

export interface ItemCarrito {
  platillo: Platillo;
  cantidad: number;
}

interface CarritoState {
  carrito: ItemCarrito[];
  modalAbierto: boolean;
  setModalAbierto: (abierto: boolean) => void;
  agregarItem: (platillo: Platillo) => void;
  actualizarCantidad: (id: string, delta: number) => void;
  eliminarItem: (id: string) => void;
  calcularTotal: () => number;
  vaciarCarrito: () => void;
}

// Función helper para vibrar fuera de componentes React
const vibrar = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(15);
  }
};

export const useStoreCarrito = create<CarritoState>((set, get) => ({
  carrito: [],
  modalAbierto: false,
  
  setModalAbierto: (abierto) => set({ modalAbierto: abierto }),

  agregarItem: (platillo) => {
    vibrar(); // Feedback háptico
    set((state) => {
      const existe = state.carrito.find(p => p.platillo.id === platillo.id);
      if (existe) {
        return {
          carrito: state.carrito.map(p => p.platillo.id === platillo.id ? { ...p, cantidad: p.cantidad + 1 } : p),
          // modalAbierto: false // No abrimos automáticamente
        };
      }
      return {
        carrito: [...state.carrito, { platillo, cantidad: 1 }],
        // modalAbierto: false // No abrimos automáticamente
      };
    });
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

  vaciarCarrito: () => set({ carrito: [] })
}));