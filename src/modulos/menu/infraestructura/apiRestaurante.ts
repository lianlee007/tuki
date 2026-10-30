
import { supabase } from '../../../lib/supabase';
import { Restaurante, Tema } from '../../../tipos/modelos';

/**
 * Colores del modo oscuro. Son columnas opcionales: si la base de datos todavía
 * no las tiene, el guardado se reintenta sin ellas en lugar de fallar. En ese
 * caso la plantilla deriva un modo oscuro correcto a partir de la paleta clara,
 * así que el resultado sigue siendo bueno para el visitante.
 */
const CAMPOS_OSCUROS: (keyof Tema)[] = [
  'color_primario_oscuro',
  'color_secundario_oscuro',
  'color_fondo_oscuro',
  'color_texto_oscuro',
  'color_texto_titulos_oscuro',
];

// null = aún no lo sabemos, true/false = ya lo comprobamos con la base de datos.
let soportaModoOscuro: boolean | null = null;

const errorColumnaDesconocida = (error: any): boolean => {
  if (!error) return false;
  const codigo = String(error.code || '');
  const mensaje = String(error.message || '');
  return codigo === 'PGRST204' || codigo === '42703' || /does not exist|schema cache|could not find/i.test(mensaje);
};

const sinCamposOscuros = (datos: Partial<Tema>): Partial<Tema> => {
  const copia: Record<string, unknown> = { ...datos };
  CAMPOS_OSCUROS.forEach((campo) => delete copia[campo as string]);
  return copia as Partial<Tema>;
};

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
      // Paleta inicial "Naranja Brasa" (coincide con la primera opción del selector)
      color_primario: '#EA580C',
      color_secundario: '#16A34A',
      color_fondo: '#FDF8F3',
      color_texto: '#2A1B12',
      color_texto_titulos: '#1A0F08',
      fuente_titulos: 'Playfair Display',
      fuente_cuerpo: 'Inter'
    }).select().single();
  },

  actualizarTema: async (id: string, datos: Partial<Tema>) => {
    const traeOscuros = CAMPOS_OSCUROS.some((campo) => campo in datos);

    // Si sabemos que la tabla no soporta el modo oscuro (o el cambio no lo toca),
    // guardamos directamente solo los campos soportados.
    if (!traeOscuros || soportaModoOscuro === false) {
      return await supabase.from('temas').update(sinCamposOscuros(datos)).eq('id', id);
    }

    const intento = await supabase.from('temas').update(datos).eq('id', id);
    if (!intento.error) {
      soportaModoOscuro = true;
      return intento;
    }

    if (errorColumnaDesconocida(intento.error)) {
      soportaModoOscuro = false;
      console.warn(
        '[tema] La tabla `temas` no tiene las columnas de modo oscuro. ' +
        'Se guarda solo la paleta clara y el modo oscuro se calcula automáticamente.'
      );
      return await supabase.from('temas').update(sinCamposOscuros(datos)).eq('id', id);
    }

    return intento;
  }
};
