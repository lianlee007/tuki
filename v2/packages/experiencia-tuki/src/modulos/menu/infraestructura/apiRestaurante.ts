import { apis, aRestaurante, aRestauranteDto, aTema, aTemaDto, intentar } from '../../../lib/api-tuki';
import type { Restaurante, Tema } from '../../../tipos/modelos';

/**
 * Perfil y tema del restaurante del dueño.
 *
 * El servicio crea el tema por defecto junto con el restaurante, así que ya no
 * hace falta sembrarlo desde el navegador. Los colores del modo oscuro se
 * guardan cuando la base los soporta y se omiten sin romper el guardado.
 */
export const apiRestaurante = {
  obtenerPorUsuario: async (_userId: string) => {
    const { data, error } = await intentar(() => apis.restaurantes.mios());

    // 404 significa «esta cuenta aún no tiene restaurante»: el panel lo crea.
    if (error?.code === 'no_encontrado' || error?.code === 'sin_restaurante') {
      return { data: null, error: null };
    }

    return { data: data ? aRestaurante({ ...data.restaurante, duenoId: data.duenoId }) : null, error };
  },

  crear: async (_userId: string, userData: { email?: string; nombre?: string; apellido?: string }) => {
    const { data, error } = await intentar(() =>
      apis.restaurantes.crear({
        nombre: 'Mi Nuevo Restaurante',
        descripcion: 'Bienvenido a nuestro sitio web.',
        eslogan: 'Calidad y sabor',
        email: userData.email,
        horarioApertura: '09:00',
        horarioCierre: '22:00',
      }),
    );

    return {
      data: data ? aRestaurante(data.restaurante as never) : null,
      error,
    };
  },

  actualizar: async (id: string, datos: Partial<Restaurante>) => {
    return intentar(() => apis.restaurantes.actualizar(id, aRestauranteDto(datos)));
  },

  obtenerTema: async (restauranteId: string) => {
    const { data, error } = await intentar(() => apis.restaurantes.panel(restauranteId));
    return { data: data ? aTema(data.tema) : null, error };
  },

  crearTemaDefault: async (restauranteId: string) => {
    const { data, error } = await intentar(() =>
      apis.restaurantes.actualizarTema(restauranteId, {
        estiloPlantilla: 'moderno',
        colorPrimario: '#EA580C',
        colorSecundario: '#16A34A',
        colorFondo: '#FDF8F3',
        colorTexto: '#2A1B12',
        colorTextoTitulos: '#1A0F08',
        fuenteTitulos: 'Playfair Display',
        fuenteCuerpo: 'Inter',
      }),
    );

    return { data: data ? aTema(data as never) : null, error };
  },

  actualizarTema: async (id: string, datos: Partial<Tema>) => {
    return intentar(() => apis.restaurantes.actualizarTema(id, aTemaDto(datos)));
  },
};
