import { useCallback, useEffect, useState } from 'react';
import { apiCuenta } from '../api/apiCuenta';
import {
  datosEnvioCompletos,
  normalizarDatosEnvio,
  type DatosEnvio,
  type DatosEnvioCuenta,
} from '../lib/datosEnvio';

export interface EstadoDatosEnvio {
  datos: DatosEnvioCuenta | null;
  cargando: boolean;
  error: string | null;
  /** `true` cuando teléfono, dirección y barrio están completos. */
  completo: boolean;
  /** Guarda y devuelve un mensaje de error, o `null` si salió bien. */
  guardar: (datos: DatosEnvio) => Promise<string | null>;
  recargar: () => void;
}

/**
 * Estado de los datos de envío de la cuenta.
 *
 * Se usa en «Mi cuenta» y en el carrito. La consulta es a la propia fila de
 * `users`; si la cuenta no tiene datos, `datos` queda con los campos vacíos y
 * `completo` en `false` para que la interfaz invite a guardarlos.
 */
export const useDatosEnvio = (usuarioId?: string | null): EstadoDatosEnvio => {
  const [datos, setDatos] = useState<DatosEnvioCuenta | null>(null);
  const [cargando, setCargando] = useState(Boolean(usuarioId));
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vigente = true;

    if (!usuarioId) {
      setDatos(null);
      setCargando(false);
      setError(null);
      return;
    }

    setCargando(true);
    setError(null);

    (async () => {
      try {
        const { datos: encontrados, error: fallo } = await apiCuenta.datosEnvio(usuarioId);
        if (!vigente) return;

        if (fallo) {
          setDatos(null);
          setError('No pudimos cargar tus datos de envío.');
        } else {
          setDatos(encontrados);
        }
      } catch {
        if (vigente) {
          setDatos(null);
          setError('No pudimos cargar tus datos de envío.');
        }
      } finally {
        if (vigente) setCargando(false);
      }
    })();

    return () => {
      vigente = false;
    };
  }, [usuarioId, recarga]);

  const guardar = useCallback(
    async (entrada: DatosEnvio): Promise<string | null> => {
      if (!usuarioId) return 'Inicia sesión para guardar tus datos de envío.';

      try {
        const { error: fallo } = await apiCuenta.guardarDatosEnvio(usuarioId, entrada);
        if (fallo) return 'No pudimos guardar tus datos. Inténtalo otra vez.';

        setDatos({
          ...normalizarDatosEnvio(entrada),
          actualizadoEn: new Date().toISOString(),
          omitidoEn: null,
        });
        return null;
      } catch {
        return 'No pudimos guardar tus datos. Inténtalo otra vez.';
      }
    },
    [usuarioId]
  );

  const recargar = useCallback(() => setRecarga((valor) => valor + 1), []);

  return {
    datos,
    cargando,
    error,
    completo: datosEnvioCompletos(datos),
    guardar,
    recargar,
  };
};
