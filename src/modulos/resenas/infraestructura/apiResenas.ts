import { supabase } from '../../../lib/supabase';
import type { Resena } from '../dominio/resenas';

const CAMPOS =
  'id, calificacion, comentario, created_at, nombre_cliente, platillo_id, aprobado, visible, foto_url, foto_autor_url, respuesta_dueno';

/**
 * Las reseñas piden también el conteo de «Es útil» mediante la relación con
 * `resenas_utiles`. PostgREST devuelve `[{ count: n }]` por fila.
 */
const CAMPOS_CON_UTILES = `${CAMPOS}, resenas_utiles(count)`;

/** Reseña con el restaurante al que pertenece, tal como la usa «Mi cuenta». */
export type ResenaConRestaurante = Resena & {
  restaurante: {
    id: string;
    nombre: string;
    imagen_logo_url: string | null;
    ciudad: string | null;
  } | null;
};

/** Normaliza una fila de PostgREST al tipo del dominio. */
const desdeFila = (fila: any): Resena => ({
  ...fila,
  calificacion: Number(fila.calificacion),
  utiles: Array.isArray(fila.resenas_utiles)
    ? Number(fila.resenas_utiles[0]?.count ?? 0)
    : 0,
  resenas_utiles: undefined,
});

/**
 * Reseñas de un restaurante.
 *
 * Todas las reseñas son públicas al enviarse, así que la ficha y el panel usan
 * exactamente la misma lista. El dueño no puede ocultarlas ni aprobarlas.
 *
 * El conteo de «Es útil» viene de una tabla nueva. Mientras la migración no
 * esté aplicada, PostgREST rechaza la consulta anidada: en ese caso se vuelve a
 * pedir la lista sin el conteo para que la ficha siga funcionando.
 */
export const apiResenas = {
  listar: async (restauranteId: string) => {
    const consultar = (campos: string) =>
      supabase
        .from('valoraciones')
        .select(campos)
        .eq('restaurante_id', restauranteId)
        .order('created_at', { ascending: false })
        .limit(200);

    let { data, error } = await consultar(CAMPOS_CON_UTILES);

    if (error) {
      ({ data, error } = await consultar(CAMPOS));
    }

    return {
      resenas: ((data || []) as any[]).map(desdeFila),
      error,
    };
  },

  /**
   * Las reseñas de la cuenta que tiene la sesión, con el restaurante al que
   * pertenecen. La política de lectura ya deja ver las propias aunque el dueño
   * las haya ocultado, así que «Mi cuenta» puede mostrar el estado real.
   */
  mias: async (usuarioId: string) => {
    const { data, error } = await supabase
      .from('valoraciones')
      .select(`${CAMPOS}, restaurantes ( id, nombre, imagen_logo_url, ciudad )`)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(100);

    return {
      resenas: (data || []).map((fila: any) => ({
        ...desdeFila(fila),
        restaurante: fila.restaurantes ?? null,
        restaurantes: undefined,
      })) as ResenaConRestaurante[],
      error,
    };
  },

  crear: async (entrada: {
    restauranteId: string;
    platilloId?: string | null;
    calificacion: number;
    comentario: string;
    nombre: string;
    email?: string | null;
    fotoUrl?: string | null;
    /** Foto de perfil del autor; se congela en la reseña. */
    fotoAutorUrl?: string | null;
  }) => {
    const fila = {
      restaurante_id: entrada.restauranteId,
      platillo_id: entrada.platilloId || null,
      calificacion: entrada.calificacion,
      comentario: entrada.comentario.trim() || null,
      nombre_cliente: entrada.nombre.trim() || 'Comensal',
      email_cliente: entrada.email || null,
      foto_url: entrada.fotoUrl || null,
      foto_autor_url: entrada.fotoAutorUrl || null,
    };

    // `aprobado` no se envía: lo decide el valor por defecto de la base de
    // datos. Tras la migración de publicación directa el valor es `true`.
    const insertar = (extra: Record<string, unknown> = {}) =>
      supabase
        .from('valoraciones')
        .insert({ ...fila, ...extra })
        .select('aprobado, visible')
        .single();

    let { data, error } = await insertar();

    // Compatibilidad con una base de datos a la que todavía le falta la
    // columna del avatar: la reseña se guarda aunque no traiga la foto.
    const sinColumnaAvatar =
      error &&
      (error.code === '42703' ||
        error.code === 'PGRST204' ||
        /foto_autor_url/i.test(error.message));

    if (sinColumnaAvatar) {
      const sinAvatar: any = { ...fila };
      delete sinAvatar.foto_autor_url;
      const reintento = await supabase
        .from('valoraciones')
        .insert(sinAvatar)
        .select('aprobado, visible')
        .single();
      data = reintento.data;
      error = reintento.error;
    }

    // Compatibilidad con una base de datos que todavía tenga la política
    // antigua (`aprobado is false`): la reseña se guarda, aunque quede
    // pendiente hasta aplicar la migración. Nunca se pierde lo que escribió
    // el comensal por un error de RLS.
    const esRls =
      error &&
      (error.code === '42501' ||
        /row-level security|seguridad a nivel de fila/i.test(error.message));

    if (esRls) {
      const reintento = await insertar({ aprobado: false, visible: true });
      data = reintento.data;
      error = reintento.error;
    }

    return {
      error,
      publicada: Boolean(
        data && data.aprobado !== false && data.visible !== false
      ),
    };
  },

  /** Respuesta pública del dueño. `null` la borra. */
  responder: async (id: string, respuesta: string | null) => {
    const texto = respuesta?.trim() || null;
    const { error } = await supabase
      .from('valoraciones')
      .update({ respuesta_dueno: texto })
      .eq('id', id);

    return { error };
  },

  /** Borra una reseña propia. La política de borrado solo deja al autor. */
  eliminar: async (id: string) => {
    const { error } = await supabase.from('valoraciones').delete().eq('id', id);
    return { error };
  },

  /**
   * Reseñas que esta cuenta ya marcó como útiles.
   *
   * Devuelve los identificadores, no los conteos: el conteo público ya viene
   * en `listar`. Si la tabla todavía no existe, el error se devuelve y la
   * interfaz simplemente pinta el corazón sin relleno.
   */
  utilesDe: async (resenaIds: string[], usuarioId: string) => {
    if (resenaIds.length === 0) return { ids: [] as string[], error: null };

    const { data, error } = await supabase
      .from('resenas_utiles')
      .select('resena_id')
      .eq('usuario_id', usuarioId)
      .in('resena_id', resenaIds);

    return {
      ids: ((data || []) as any[]).map((fila) => fila.resena_id as string),
      error,
    };
  },

  /**
   * Marca o desmarca «Es útil».
   *
   * La clave primaria `(resena_id, usuario_id)` impide votar dos veces; si el
   * voto ya existía, el error de duplicado se trata como éxito para que el
   * botón quede en el estado que el comensal pidió.
   */
  alternarUtil: async (
    resenaId: string,
    usuarioId: string,
    yaUtil: boolean
  ) => {
    if (yaUtil) {
      const { error } = await supabase
        .from('resenas_utiles')
        .delete()
        .eq('resena_id', resenaId)
        .eq('usuario_id', usuarioId);

      return { error, activo: false };
    }

    const { error } = await supabase
      .from('resenas_utiles')
      .insert({ resena_id: resenaId, usuario_id: usuarioId });

    if (error && error.code === '23505') {
      return { error: null, activo: true };
    }

    return { error, activo: !error };
  },
};
