
import { supabase } from '../lib/supabase';
import { Restaurante, Tema } from '../tipos/modelos';

export const apiRestaurante = {
  obtenerPorUsuario: async (userId: string) => {
    return await supabase
      .from('restaurantes')
      .select('*')
      .eq('usuario_id', userId)
      .maybeSingle();
  },

  crear: async (userId: string, userData: any) => {
    // Asegurar usuario
    const { data: userExists } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
    if (!userExists) {
        await supabase.from('users').insert({
            id: userId,
            email: userData.email!,
            nombre: userData.nombre || 'Usuario',
            apellido: userData.apellido || 'Nuevo'
        });
    }

    return await supabase.from('restaurantes').insert({
        usuario_id: userId,
        nombre: 'Mi Nuevo Restaurante',
        descripcion: 'Bienvenido a nuestro sitio web.',
        eslogan: 'Calidad y sabor',
        horario_apertura: '09:00',
        horario_cierre: '22:00',
        dias_abierto: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true, sabado: true, domingo: true }
    }).select().single();
  },

  actualizar: async (id: string, datos: Partial<Restaurante>) => {
    return await supabase.from('restaurantes').update(datos).eq('id', id);
  },

  obtenerTema: async (restauranteId: string) => {
    return await supabase.from('temas').select('*').eq('restaurante_id', restauranteId).maybeSingle();
  },

  crearTemaDefault: async (restauranteId: string) => {
    return await supabase.from('temas').insert({ 
      restaurante_id: restauranteId,
      estilo_plantilla: 'moderno', // Valor por defecto
      color_primario: '#EA580C',
      color_secundario: '#10B981',
      color_fondo: '#B8BEC5',
      color_texto: '#0F172A',
      color_texto_titulos: '#0F172A',
      fuente_titulos: 'Playfair Display',
      fuente_cuerpo: 'Inter'
    }).select().single();
  },

  actualizarTema: async (id: string, datos: Partial<Tema>) => {
    return await supabase.from('temas').update(datos).eq('id', id);
  }
};
