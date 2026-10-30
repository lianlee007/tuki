import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiResenas } from '../infraestructura/apiResenas';
import {
  resenasPublicas,
  resumenRestaurante,
  type Resena,
} from '../dominio/resenas';

/**
 * Las reseñas de una ficha, una sola vez.
 *
 * La ficha pública y el panel comparten la consulta, pero no el filtro: el
 * panel necesita las pendientes y la ficha solo las públicas. `resumen` se
 * calcula sobre las públicas para que el número de la portada sea el mismo que
 * ve el visitante en la lista.
 */
export const useResenas = (restauranteId?: string) => {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [cargando, setCargando] = useState(Boolean(restauranteId));
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const recargar = useCallback(() => setVersion((valor) => valor + 1), []);

  useEffect(() => {
    if (!restauranteId) {
      setCargando(false);
      return;
    }

    let vigente = true;
    setCargando(true);
    setError(null);

    apiResenas
      .listar(restauranteId)
      .then(({ resenas: encontradas, error: fallo }) => {
        if (!vigente) return;
        if (fallo) {
          setError('No pudimos cargar las reseñas.');
          setResenas([]);
        } else {
          setResenas(encontradas);
        }
        setCargando(false);
      })
      .catch(() => {
        if (!vigente) return;
        setError('No pudimos cargar las reseñas.');
        setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [restauranteId, version]);

  const publicas = useMemo(() => resenasPublicas(resenas), [resenas]);
  const resumen = useMemo(() => resumenRestaurante(publicas), [publicas]);

  return { resenas, publicas, resumen, cargando, error, recargar };
};
