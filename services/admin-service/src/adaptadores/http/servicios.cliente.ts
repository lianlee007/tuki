import { config } from '../../config.js';
import type {
  FiltrosListado,
  Panorama,
  RestauranteAdmin,
  UsuarioAdmin,
} from '../../dominio/admin.js';
import { errorServicioNoDisponible } from '../../dominio/errores.js';
import type {
  ListadoRestaurantes,
  ListadoUsuarios,
  ServiciosRemotos,
} from '../../puertos/servicios.remotos.js';

export interface UrlsServicios {
  identidad: string;
  restaurantes: string;
  pedidos: string;
}

const base = (url: string) => url.replace(/\/+$/, '');

/** Adaptador HTTP del puerto `ServiciosRemotos`. */
export const crearServiciosRemotos = (
  urls: UrlsServicios = {
    identidad: config.IDENTIDAD_URL,
    restaurantes: config.RESTAURANTES_URL,
    pedidos: config.PEDIDOS_URL,
  },
): ServiciosRemotos => {
  const solicitar = async <T>(
    url: string,
    token: string,
    init: RequestInit = {},
  ): Promise<T> => {
    let respuesta: Response;
    try {
      respuesta = await fetch(url, {
        ...init,
        headers: {
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          Authorization: `Bearer ${token}`,
          ...init.headers,
        },
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      throw errorServicioNoDisponible('Un servicio dependiente no respondió.');
    }

    if (!respuesta.ok) {
      throw errorServicioNoDisponible('Un servicio dependiente devolvió un error.');
    }
    return (await respuesta.json()) as T;
  };

  const panorama = async (token: string): Promise<Panorama> => {
    const [usuarios, restaurantes, pedidos] = await Promise.all([
      solicitar<Panorama['usuarios']>(
        `${base(urls.identidad)}/v1/admin/usuarios/resumen`,
        token,
      ),
      solicitar<Panorama['restaurantes']>(
        `${base(urls.restaurantes)}/v1/admin/restaurantes/resumen`,
        token,
      ),
      solicitar<Panorama['pedidos']>(
        `${base(urls.pedidos)}/v1/admin/pedidos/resumen`,
        token,
      ),
    ]);
    return { usuarios, restaurantes, pedidos };
  };

  const listarRestaurantes = (
    token: string,
    filtros: FiltrosListado,
  ): Promise<ListadoRestaurantes> => {
    const params = new URLSearchParams();
    if (filtros.q) params.set('q', filtros.q);
    params.set('limite', String(filtros.limite));
    params.set('desde', String(filtros.desde));
    return solicitar<ListadoRestaurantes>(
      `${base(urls.restaurantes)}/v1/admin/restaurantes?${params.toString()}`,
      token,
    );
  };

  const cambiarEstado = (
    token: string,
    restauranteId: string,
    activo: boolean,
  ): Promise<RestauranteAdmin> =>
    solicitar<RestauranteAdmin>(
      `${base(urls.restaurantes)}/v1/admin/restaurantes/${restauranteId}/estado`,
      token,
      { method: 'PATCH', body: JSON.stringify({ activo }) },
    );

  const listarUsuarios = (
    token: string,
    filtros: FiltrosListado,
  ): Promise<ListadoUsuarios> => {
    const params = new URLSearchParams();
    if (filtros.q) params.set('q', filtros.q);
    params.set('limite', String(filtros.limite));
    params.set('desde', String(filtros.desde));
    return solicitar<ListadoUsuarios>(
      `${base(urls.identidad)}/v1/admin/usuarios?${params.toString()}`,
      token,
    );
  };

  const cambiarRol = (
    token: string,
    usuarioId: string,
    rol: string,
  ): Promise<{ usuario: UsuarioAdmin }> =>
    solicitar<{ usuario: UsuarioAdmin }>(
      `${base(urls.identidad)}/v1/admin/usuarios/${usuarioId}/rol`,
      token,
      { method: 'PATCH', body: JSON.stringify({ rol }) },
    );

  return { panorama, listarRestaurantes, cambiarEstado, listarUsuarios, cambiarRol };
};
