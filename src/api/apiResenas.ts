import { supabase } from '../lib/supabase';
import type { Resena } from '../lib/resenas';

const CAMPOS =
  'id, calificacion, comentario, created_at, nombre_cliente, platillo_id, aprobado, visible, foto_url, respuesta_dueno';

/**
 * Reseñas de un restaurante.
 *
 * La consulta trae también las pendientes porque el panel del dueño las
 * necesita; la ficha pública filtra con `resenasPublicas`. Así una sola
 * consulta sirve a los dos públicos y no hay dos criterios que se separen.
 */
export const apiResenas = {
  listar: async (restauranteId: string) => {
    const { data, error } = await supabase
      .from('valoraciones')
      .select(CAMPOS)
      .eq('restaurante_id', restauranteId)
      .order('created_at', { ascending: false })
      .limit(200);

    return {
      resenas: ((data || []) as Resena[]).map((resena) => ({
        ...resena,
        calificacion: Number(resena.calificacion),
      })),
      error,
    };
  },

  /**
   * Las reseñas de la cuenta que tiene la sesión, con el restaurante al que
   * pertenecen. La política de lectura ya deja ver las propias aunque sigan
   * pendientes, así que «Mi cuenta» puede mostrar el estado real.
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
        ...fila,
        calificacion: Number(fila.calificacion),
        restaurante: fila.restaurantes ?? null,
        restaurantes: undefined,
      })) as (Resena & {
        restaurante: {
          id: string;
          nombre: string;
          imagen_logo_url: string | null;
          ciudad: string | null;
        } | null;
      })[],
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
  }) => {
    const { error } = await supabase.from('valoraciones').insert({
      restaurante_id: entrada.restauranteId,
      platillo_id: entrada.platilloId || null,
      calificacion: entrada.calificacion,
      comentario: entrada.comentario.trim() || null,
      nombre_cliente: entrada.nombre.trim() || 'Comensal',
      email_cliente: entrada.email || null,
      foto_url: entrada.fotoUrl || null,
      // Toda reseña nace pendiente: el dueño decide qué se publica.
      aprobado: false,
      visible: true,
    });

    return { error };
  },

  moderar: async (id: string, aprobada: boolean) => {
    const { error } = await supabase
      .from('valoraciones')
      .update({ aprobado: aprobada, visible: aprobada })
      .eq('id', id);

    return { error };
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
};
