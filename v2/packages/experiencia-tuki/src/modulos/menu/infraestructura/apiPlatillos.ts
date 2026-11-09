import { apis, aCategoria, aPlatillo, intentar } from '../../../lib/api-tuki';
import type { Categoria, Platillo } from '../../../tipos/modelos';

/**
 * Menú del dueño sobre el servicio de restaurantes.
 *
 * El panel heredado trabaja con la categoría como texto libre. Aquí se
 * traduce a la entidad `categoria` del servicio: si el nombre no existe se
 * crea, y al leer se devuelve el nombre para que la agrupación no cambie.
 */

const idDelRestauranteActual = async (): Promise<string | null> => {
  const { data } = await intentar(() => apis.restaurantes.mios());
  return data?.restaurante.id ?? null;
};

const categoriasDe = async (restauranteId: string): Promise<Categoria[]> => {
  const { data } = await intentar(() => apis.restaurantes.panel(restauranteId));
  return (data?.categorias ?? []).map(aCategoria);
};

const asegurarCategoria = async (
  restauranteId: string,
  nombre: string | undefined,
): Promise<string | null> => {
  const limpio = (nombre ?? '').trim();
  if (!limpio) return null;

  const { data } = await intentar(() => apis.restaurantes.panel(restauranteId));
  const existente = (data?.categorias ?? []).find(
    (categoria) => categoria.nombre.toLowerCase() === limpio.toLowerCase(),
  );
  if (existente) return existente.id;

  const creada = await intentar(() =>
    apis.restaurantes.crearCategoria(restauranteId, { nombre: limpio }),
  );
  const categoria = creada.data as { id?: string } | null;
  return categoria?.id ?? null;
};

export const apiPlatillos = {
  obtenerPorRestaurante: async (restauranteId: string) => {
    const { data, error } = await intentar(() => apis.restaurantes.panel(restauranteId));

    return {
      data: data
        ? data.platillos.map((platillo) => aPlatillo(platillo, data.categorias))
        : [],
      error,
    };
  },

  obtenerCategorias: async (restauranteId: string) => {
    const { data, error } = await intentar(() => apis.restaurantes.panel(restauranteId));
    return { data: (data?.categorias ?? []).map(aCategoria), error };
  },

  guardar: async (platillo: Partial<Platillo>) => {
    const restauranteId = platillo.restaurante_id || (await idDelRestauranteActual());
    if (!restauranteId) {
      return { data: null, error: { message: 'No encontramos tu restaurante.' } };
    }

    const categoriaId = await asegurarCategoria(restauranteId, platillo.categoria);

    const datos = {
      nombre: platillo.nombre?.trim() || 'Nuevo',
      descripcion: platillo.descripcion ?? '',
      precio: Number(platillo.precio) || 0,
      categoriaId,
      imagenUrl: platillo.imagen_url || null,
      disponible: platillo.disponible ?? true,
      vegetariano: platillo.vegetariano ?? false,
      vegano: platillo.vegano ?? false,
      picante: platillo.picante ?? false,
      ingredientes: platillo.ingredientes ?? [],
      alergenos: platillo.alergenos ?? [],
      destacado: platillo.destacado ?? false,
      tiempoPreparacion: platillo.tiempo_preparacion ?? null,
    };

    if (platillo.id) {
      return intentar(() =>
        apis.restaurantes.actualizarPlatillo(restauranteId, platillo.id as string, datos),
      );
    }

    return intentar(() => apis.restaurantes.crearPlatillo(restauranteId, datos));
  },

  eliminar: async (id: string) => {
    const restauranteId = await idDelRestauranteActual();
    if (!restauranteId) {
      return { data: null, error: { message: 'No encontramos tu restaurante.' } };
    }
    return intentar(() => apis.restaurantes.eliminarPlatillo(restauranteId, id));
  },

  actualizarEstado: async (id: string, disponible: boolean, activo: boolean) => {
    const restauranteId = await idDelRestauranteActual();
    if (!restauranteId) {
      return { data: null, error: { message: 'No encontramos tu restaurante.' } };
    }

    return intentar(() =>
      apis.restaurantes.actualizarPlatillo(restauranteId, id, { disponible, activo }),
    );
  },
};
