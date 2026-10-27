
import { supabase } from '../lib/supabase';
import { Platillo } from '../tipos/modelos';

export const apiPlatillos = {
  obtenerPorRestaurante: async (restauranteId: string) => {
    return await supabase
      .from('platillos')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('orden');
  },

  obtenerCategorias: async (restauranteId: string) => {
    return await supabase
      .from('categorias')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('orden');
  },

  guardar: async (platillo: Partial<Platillo>) => {
    const payload = {
      restaurante_id: platillo.restaurante_id,
      nombre: platillo.nombre || 'Nuevo',
      descripcion: platillo.descripcion || '',
      precio: Number(platillo.precio) || 0,
      categoria: platillo.categoria || 'General',
      imagen_url: platillo.imagen_url || '',
      ingredientes: platillo.ingredientes || [],
      disponible: platillo.disponible ?? true,
      activo: platillo.visible ?? true,
      destacado: platillo.destacado ?? false
    };

    if (platillo.id) {
      return await supabase.from('platillos').update(payload).eq('id', platillo.id);
    } else {
      return await supabase.from('platillos').insert(payload);
    }
  },

  eliminar: async (id: string) => {
    return await supabase.from('platillos').delete().eq('id', id);
  },

  actualizarEstado: async (id: string, disponible: boolean, activo: boolean) => {
    return await supabase.from('platillos').update({ disponible, activo }).eq('id', id);
  }
};
