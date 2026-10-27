import { supabase } from '../lib/supabase';
import {
  normalizarDatosEnvio,
  type DatosEnvio,
  type DatosEnvioCuenta,
} from '../lib/datosEnvio';

const CAMPOS =
  'telefono, direccion, barrio, referencias, datos_envio_actualizado_en, datos_envio_omitidos_en';

const desdeFila = (fila: Record<string, unknown> | null): DatosEnvioCuenta | null => {
  if (!fila) return null;

  return {
    telefono: (fila.telefono as string | null) ?? '',
    direccion: (fila.direccion as string | null) ?? '',
    barrio: (fila.barrio as string | null) ?? '',
    referencias: (fila.referencias as string | null) ?? '',
    actualizadoEn: (fila.datos_envio_actualizado_en as string | null) ?? null,
    omitidoEn: (fila.datos_envio_omitidos_en as string | null) ?? null,
  };
};

/**
 * Datos de entrega de la cuenta.
 *
 * La tabla `users` tiene RLS por fila: cada persona lee y edita la suya. El
 * registro escribe estos campos desde el metadata y aquí solo se actualizan
 * cuando el comensal los cambia en «Mi cuenta».
 */
export const apiCuenta = {
  datosEnvio: async (usuarioId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select(CAMPOS)
      .eq('id', usuarioId)
      .maybeSingle();

    return { datos: desdeFila(data as Record<string, unknown> | null), error };
  },

  guardarDatosEnvio: async (usuarioId: string, entrada: DatosEnvio) => {
    const datos = normalizarDatosEnvio(entrada);

    const { data, error } = await supabase
      .from('users')
      .update({
        telefono: datos.telefono || null,
        direccion: datos.direccion || null,
        barrio: datos.barrio || null,
        referencias: datos.referencias || null,
        datos_envio_actualizado_en: new Date().toISOString(),
        datos_envio_omitidos_en: null,
      })
      .eq('id', usuarioId)
      .select('id')
      .maybeSingle();

    if (!error && !data) {
      return { error: new Error('No encontramos tu cuenta.') };
    }

    return { error };
  },
};
