import { config } from '../../config.js';
import {
  errorNoEncontrado,
  errorProhibido,
  errorServicioNoDisponible,
} from '../../dominio/errores.js';
import type { RestaurantesCliente } from '../../puertos/restaurantes.cliente.js';

/** Adaptador HTTP del puerto `RestaurantesCliente`. */
export const crearClienteRestaurantes = (
  baseUrl: string = config.RESTAURANTES_URL,
): RestaurantesCliente => {
  const base = baseUrl.replace(/\/+$/, '');

  const verificarRestaurante = async (restauranteId: string): Promise<void> => {
    let respuesta: Response;
    try {
      respuesta = await fetch(
        `${base}/v1/restaurantes/${encodeURIComponent(restauranteId)}/platos-publicos`,
        { signal: AbortSignal.timeout(5_000) },
      );
    } catch {
      throw errorServicioNoDisponible('No pudimos verificar el restaurante.');
    }

    if (respuesta.status === 404) throw errorNoEncontrado('No encontramos el restaurante.');
    if (!respuesta.ok) throw errorServicioNoDisponible('El servicio de restaurantes falló.');
  };

  const verificarPropietario = async (
    restauranteId: string,
    token: string,
  ): Promise<void> => {
    let respuesta: Response;
    try {
      respuesta = await fetch(
        `${base}/v1/restaurantes/${encodeURIComponent(restauranteId)}/panel`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(5_000),
        },
      );
    } catch {
      throw errorServicioNoDisponible('No pudimos verificar el restaurante.');
    }

    if (respuesta.status === 403 || respuesta.status === 404) {
      throw errorProhibido('Ese restaurante no pertenece a tu cuenta.');
    }
    if (!respuesta.ok) throw errorServicioNoDisponible('El servicio de restaurantes falló.');
  };

  return { verificarRestaurante, verificarPropietario };
};
