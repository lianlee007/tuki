import { supabase } from '../lib/supabase';
import type {
  FiltrosDescubrir,
  FiltrosRestaurantes,
  PlatoDescubierto,
  RestauranteDescubierto,
  TipoCocina,
} from '../tipos/modelos';

/**
 * Todo lo que necesita la portada social: la taxonomía de cocinas, el feed de
 * platos y el carril de restaurantes. Las búsquedas viven en funciones de
 * Postgres (`buscar_platos`, `buscar_restaurantes`) para que el filtro, el
 * total y la paginación se resuelvan en una sola llamada y no en tres.
 */
export const apiDescubrir = {
  cocinas: async () => {
    const { data, error } = await supabase
      .from('tipos_cocina')
      .select('id, slug, nombre, icono, orden')
      .eq('activo', true)
      .order('orden');

    return { cocinas: (data || []) as TipoCocina[], error };
  },

  buscar: async (filtros: FiltrosDescubrir) => {
    const { data, error } = await supabase.rpc('buscar_platos', {
      p_q: filtros.q?.trim() || null,
      p_cocina: filtros.cocina || null,
      p_precio_min: filtros.precioMin ?? null,
      p_precio_max: filtros.precioMax ?? null,
      p_vegetariano: filtros.vegetariano ?? null,
      p_vegano: filtros.vegano ?? null,
      p_picante: filtros.picante ?? null,
      p_ciudad: filtros.ciudad || null,
      p_limite: filtros.limite ?? 24,
      p_desde: filtros.desde ?? 0,
    });

    // PostgREST puede devolver los `numeric` como texto; el resto de la app
    // trabaja con números y aquí es el único sitio donde se cruza la frontera.
    const platos = ((data || []) as PlatoDescubierto[]).map((plato) => ({
      ...plato,
      precio: Number(plato.precio),
      rating: Number(plato.rating),
      rating_cantidad: Number(plato.rating_cantidad),
      total: Number(plato.total),
    }));

    return { platos, error };
  },

  restaurantes: async (filtros: FiltrosRestaurantes = {}) => {
    const { data, error } = await supabase.rpc('buscar_restaurantes', {
      p_q: filtros.q?.trim() || null,
      p_cocina: filtros.cocina || null,
      p_limite: filtros.limite ?? 12,
      p_desde: filtros.desde ?? 0,
    });

    const restaurantes = ((data || []) as RestauranteDescubierto[]).map((restaurante) => ({
      ...restaurante,
      rating: Number(restaurante.rating),
      rating_cantidad: Number(restaurante.rating_cantidad),
      platos_cantidad: Number(restaurante.platos_cantidad),
      precio_min: restaurante.precio_min === null ? null : Number(restaurante.precio_min),
      precio_max: restaurante.precio_max === null ? null : Number(restaurante.precio_max),
      total: Number(restaurante.total),
    }));

    return { restaurantes, error };
  },

  /** El teléfono se pide al abrir el carrito: el feed no lo necesita. */
  contacto: async (restauranteId: string) => {
    const { data, error } = await supabase
      .from('restaurantes')
      .select('nombre, whatsapp, telefono')
      .eq('id', restauranteId)
      .maybeSingle();

    return {
      contacto: data as { nombre: string; whatsapp: string | null; telefono: string | null } | null,
      error,
    };
  },
};
