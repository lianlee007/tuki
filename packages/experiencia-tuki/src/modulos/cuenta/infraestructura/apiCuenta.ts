import {
  normalizarDatosEnvio,
  type DatosEnvio,
  type DatosEnvioCuenta,
} from '../dominio/datosEnvio';

/**
 * Datos de entrega de la cuenta.
 *
 * El servicio de identidad todavía no expone direcciones de envío, así que se
 * guardan en el navegador por cuenta. Al crear un pedido viajan igual al
 * servicio de pedidos, que es quien los necesita.
 */
const clave = (usuarioId: string) => `tuki.envio.${usuarioId}`;

export const apiCuenta = {
  datosEnvio: async (usuarioId: string) => {
    try {
      const crudo = localStorage.getItem(clave(usuarioId));
      if (!crudo) return { datos: null, error: null };
      return { datos: JSON.parse(crudo) as DatosEnvioCuenta, error: null };
    } catch {
      return { datos: null, error: { message: 'No pudimos leer tus datos de envío.' } };
    }
  },

  guardarDatosEnvio: async (usuarioId: string, entrada: DatosEnvio) => {
    try {
      const datos = normalizarDatosEnvio(entrada);
      const guardado: DatosEnvioCuenta = {
        telefono: datos.telefono,
        direccion: datos.direccion,
        barrio: datos.barrio,
        referencias: datos.referencias,
        actualizadoEn: new Date().toISOString(),
        omitidoEn: null,
      };
      localStorage.setItem(clave(usuarioId), JSON.stringify(guardado));
      return { error: null };
    } catch {
      return { error: { message: 'No pudimos guardar tus datos de envío.' } };
    }
  },
};
