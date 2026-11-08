import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface ItemCarrito {
  platilloId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface ContextoCarrito {
  items: ItemCarrito[];
  agregar: (item: Omit<ItemCarrito, 'cantidad'>) => void;
  quitar: (platilloId: string) => void;
  vaciar: () => void;
  total: number;
}

const CLAVE = 'tuki.carrito';
const Contexto = createContext<ContextoCarrito | null>(null);

const leer = (): ItemCarrito[] => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as ItemCarrito[];
  } catch {
    return [];
  }
};

/** Carrito local por navegador; el pedido real se crea en pedidos-service. */
export const ProveedorCarrito: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<ItemCarrito[]>(leer);

  useEffect(() => {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  }, [items]);

  const agregar = (item: Omit<ItemCarrito, 'cantidad'>) => {
    setItems((previos) => {
      const existente = previos.find((previo) => previo.platilloId === item.platilloId);
      if (existente) {
        return previos.map((previo) =>
          previo.platilloId === item.platilloId
            ? { ...previo, cantidad: previo.cantidad + 1 }
            : previo,
        );
      }
      return [...previos, { ...item, cantidad: 1 }];
    });
  };

  const quitar = (platilloId: string) => {
    setItems((previos) =>
      previos
        .map((previo) =>
          previo.platilloId === platilloId
            ? { ...previo, cantidad: previo.cantidad - 1 }
            : previo,
        )
        .filter((previo) => previo.cantidad > 0),
    );
  };

  const vaciar = () => setItems([]);

  const total = useMemo(
    () => items.reduce((suma, item) => suma + item.precio * item.cantidad, 0),
    [items],
  );

  return (
    <Contexto.Provider value={{ items, agregar, quitar, vaciar, total }}>
      {children}
    </Contexto.Provider>
  );
};

export const useCarrito = (): ContextoCarrito => {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useCarrito debe usarse dentro de ProveedorCarrito.');
  return contexto;
};
