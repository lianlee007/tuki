
import { useState } from 'react';
import { Platillo } from '../tipos';

export interface ItemCarrito {
  platillo: Platillo;
  cantidad: number;
}

export const useCarrito = () => {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);

  const agregarItem = (platillo: Platillo) => {
    setCarrito(prev => {
      const existe = prev.find(p => p.platillo.id === platillo.id);
      if (existe) {
        return prev.map(p => p.platillo.id === platillo.id ? {...p, cantidad: p.cantidad + 1} : p);
      }
      return [...prev, { platillo, cantidad: 1 }];
    });
    setModalAbierto(true);
  };

  const actualizarCantidad = (id: string, delta: number) => {
    setCarrito(prev => prev.map(item => {
      if (item.platillo.id === id) {
        const nuevaCant = item.cantidad + delta;
        return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : item;
      }
      return item;
    }));
  };

  const eliminarItem = (id: string) => {
    setCarrito(prev => prev.filter(item => item.platillo.id !== id));
  };

  const calcularTotal = () => {
    return carrito.reduce((acc, item) => acc + (item.platillo.precio * item.cantidad), 0);
  };

  const vaciarCarrito = () => setCarrito([]);

  return {
    carrito,
    modalAbierto,
    setModalAbierto,
    agregarItem,
    actualizarCantidad,
    eliminarItem,
    calcularTotal,
    vaciarCarrito
  };
};
