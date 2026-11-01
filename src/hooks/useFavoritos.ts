import { useCallback, useEffect, useState } from 'react';

/**
 * Favoritos del comensal.
 *
 * El feed no tiene tabla de favoritos todavía, así que se guardan en el
 * navegador. La clave es estable y solo contiene identificadores: ni correos ni
 * nombres. Si el almacenamiento está bloqueado (modo privado), la función sigue
 * trabajando en memoria durante la sesión.
 */
const CLAVE = 'tuki_favoritos';

const leerGuardados = (): string[] => {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return Array.isArray(crudo) ? crudo.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

export const useFavoritos = () => {
  const [favoritos, setFavoritos] = useState<string[]>(leerGuardados);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(favoritos));
    } catch {
      // Sin almacenamiento los favoritos viven solo en memoria.
    }
  }, [favoritos]);

  const esFavorito = useCallback((id: string) => favoritos.includes(id), [favoritos]);

  const alternar = useCallback((id: string) => {
    setFavoritos((previos) =>
      previos.includes(id) ? previos.filter((guardado) => guardado !== id) : [...previos, id]
    );
  }, []);

  return { favoritos, esFavorito, alternar };
};
