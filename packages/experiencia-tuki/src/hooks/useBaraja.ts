import { useCallback, useState } from 'react';
import type { PlatoDescubierto } from '../tipos/modelos';

/** Hacia dónde salió la tarjeta: antojo o descarte. */
export type DireccionBaraja = 'derecha' | 'izquierda';

export interface DecisionBaraja {
  plato: PlatoDescubierto;
  direccion: DireccionBaraja;
  /** Si ya estaba guardado, deshacer no debe borrarlo. */
  yaEraFavorito: boolean;
}

interface OpcionesBaraja {
  /** ¿Este plato ya estaba en favoritos antes del gesto? */
  esFavorito: (idPlato: string) => boolean;
  alAprobar: (plato: PlatoDescubierto, yaEraFavorito: boolean) => void;
  alDescartar: (plato: PlatoDescubierto) => void;
  alDeshacer: (decision: DecisionBaraja) => void;
}

/**
 * Estado de la baraja de Descubrir.
 *
 * La pila solo guarda los platos que quedan por decidir. Cada gesto deja una
 * decisión en el historial para poder deshacerlo sin volver a pedir datos al
 * servidor. La página decide qué significa aprobar o descartar; el hook solo
 * mueve las cartas.
 */
export const useBaraja = ({
  esFavorito,
  alAprobar,
  alDescartar,
  alDeshacer,
}: OpcionesBaraja) => {
  const [baraja, setBaraja] = useState<PlatoDescubierto[]>([]);
  const [historial, setHistorial] = useState<DecisionBaraja[]>([]);
  /** Última dirección: AnimatePresence la usa para lanzar la salida. */
  const [salida, setSalida] = useState<DireccionBaraja>('derecha');

  const repartir = useCallback((platos: PlatoDescubierto[]) => {
    setBaraja(platos);
    setHistorial([]);
    setSalida('derecha');
  }, []);

  const decidir = useCallback(
    (plato: PlatoDescubierto, direccion: DireccionBaraja) => {
      const yaEraFavorito = esFavorito(plato.id);

      setSalida(direccion);
      setHistorial((previas) => [...previas, { plato, direccion, yaEraFavorito }]);
      setBaraja((actuales) => actuales.filter((actual) => actual.id !== plato.id));

      if (direccion === 'derecha') alAprobar(plato, yaEraFavorito);
      else alDescartar(plato);
    },
    [alAprobar, alDescartar, esFavorito]
  );

  const deshacer = useCallback(() => {
    const ultima = historial[historial.length - 1];
    if (!ultima) return;

    setHistorial((previas) => previas.slice(0, -1));
    setBaraja((actuales) => [
      ultima.plato,
      ...actuales.filter((actual) => actual.id !== ultima.plato.id),
    ]);
    alDeshacer(ultima);
  }, [alDeshacer, historial]);

  return {
    baraja,
    historial,
    salida,
    puedeDeshacer: historial.length > 0,
    repartir,
    decidir,
    deshacer,
  };
};
