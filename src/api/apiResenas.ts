import { supabase } from '../lib/supabase';
import type { Resena } from '../lib/resenas';

const CAMPOS = 'id, calificacion, comentario, created_at, nombre_cliente, platillo_id, aprobado, visible';

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

  crear: async (entrada: {
    restauranteId: string;
    platilloId?: string | null;
    calificacion: number;
    comentario: string;
    nombre: string;
    email?: string | null;
  }) => {
    const { error } = await supabase.from('valoraciones').insert({
      restaurante_id: entrada.restauranteId,
      platillo_id: entrada.platilloId || null,
      calificacion: entrada.calificacion,
      comentario: entrada.comentario.trim() || null,
      nombre_cliente: entrada.nombre.trim() || 'Comensal',
      email_cliente: entrada.email || null,
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
};
