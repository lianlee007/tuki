import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiResenas } from '../infraestructura/apiResenas';
import { resumenRestaurante, type Resena } from '../dominio/resenas';

/**
 * Las reseñas de una ficha, una sola vez.
 *
 * La ficha pública y el panel comparten la consulta y la lista: todas las
 * reseñas son públicas al enviarse. `resumen` se calcula sobre esa misma lista
 * para que el número de la portada coincida con el de la ficha.
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

  const resumen = useMemo(() => resumenRestaurante(resenas), [resenas]);

  return { resenas, resumen, cargando, error, recargar };
};
