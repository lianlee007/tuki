import { apis, aPlatoDescubierto, aRestauranteDescubierto, aTipoCocina, intentar } from '../lib/api-tuki';
import type {
  FiltrosDescubrir,
  FiltrosRestaurantes,
} from '../tipos/modelos';

/**
 * Portada social de Tuki sobre el servicio de restaurantes.
 *
 * La búsqueda, el total y la paginación viajan en una sola respuesta, igual
 * que antes con las funciones de Postgres.
 */
export const apiDescubrir = {
  cocinas: async () => {
    const { data, error } = await intentar(() => apis.restaurantes.cocinas());

    return {
      cocinas: (data?.cocinas ?? []).map(aTipoCocina),
      error,
    };
  },

  buscar: async (filtros: FiltrosDescubrir) => {
    const { data, error } = await intentar(() =>
      apis.restaurantes.platos({
        q: filtros.q?.trim() || undefined,
        cocina: filtros.cocina || undefined,
        precioMin: filtros.precioMin,
        precioMax: filtros.precioMax,
        vegetariano: filtros.vegetariano,
        vegano: filtros.vegano,
        picante: filtros.picante,
        ciudad: filtros.ciudad || undefined,
        limite: filtros.limite ?? 24,
        desde: filtros.desde ?? 0,
      }),
    );

    const total = data?.total ?? 0;
    return {
      platos: (data?.items ?? []).map((plato) => ({
        ...aPlatoDescubierto(plato),
        total,
      })),
      error,
    };
  },

  restaurantes: async (filtros: FiltrosRestaurantes = {}) => {
    const { data, error } = await intentar(() =>
      apis.restaurantes.listar({
        q: filtros.q?.trim() || undefined,
        cocina: filtros.cocina || undefined,
        limite: filtros.limite ?? 12,
        desde: filtros.desde ?? 0,
      }),
    );

    const total = data?.total ?? 0;
    return {
      restaurantes: (data?.items ?? []).map((restaurante) =>
        aRestauranteDescubierto(restaurante, total),
      ),
      error,
    };
  },

  /** El teléfono se pide al abrir el carrito: el feed no lo necesita. */
  contacto: async (restauranteId: string) => {
    const { data, error } = await intentar(() =>
      apis.restaurantes.menuPublico(restauranteId),
    );

    return {
      contacto: data
        ? {
            nombre: data.restaurante.nombre,
            whatsapp: data.restaurante.whatsapp,
            telefono: data.restaurante.telefono,
          }
        : null,
      error,
    };
  },
};
