import { config } from '../config.js';
import { errorNoEncontrado, errorProhibido, errorServicioNoDisponible } from '../lib/errores.js';

/** Menú público mínimo que necesita el carrito. */
export interface MenuPublico {
  restaurante: {
    id: string;
    nombre: string;
    slug: string;
    whatsapp: string | null;
    telefono: string | null;
  };
  platillos: {
    id: string;
    nombre: string;
    precio: number;
    disponible: boolean;
    activo: boolean;
  }[];
}

const base = config.RESTAURANTES_URL.replace(/\/+$/, '');

/** Consulta el menú público del restaurante. */
export const obtenerMenu = async (restauranteId: string): Promise<MenuPublico> => {
  let respuesta: Response;
  try {
    respuesta = await fetch(
      `${base}/v1/restaurantes/${encodeURIComponent(restauranteId)}/platos-publicos`,
      { signal: AbortSignal.timeout(5_000) },
    );
  } catch {
    throw errorServicioNoDisponible('No pudimos consultar el menú del restaurante.');
  }

  if (respuesta.status === 404) {
    throw errorNoEncontrado('No encontramos ese restaurante.');
  }
  if (!respuesta.ok) {
    throw errorServicioNoDisponible('El servicio de restaurantes no respondió.');
  }

  return (await respuesta.json()) as MenuPublico;
};

/** Verifica que el token pertenezca al dueño del restaurante. */
export const verificarPropietario = async (
  restauranteId: string,
  token: string,
): Promise<void> => {
  let respuesta: Response;
  try {
    respuesta = await fetch(
      `${base}/v1/restaurantes/${encodeURIComponent(restauranteId)}/panel`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5_000),
      },
    );
  } catch {
    throw errorServicioNoDisponible('No pudimos verificar el restaurante.');
  }

  if (respuesta.status === 403 || respuesta.status === 404) {
    throw errorProhibido('Ese restaurante no pertenece a tu cuenta.');
  }
  if (!respuesta.ok) {
    throw errorServicioNoDisponible('El servicio de restaurantes no respondió.');
  }
};
