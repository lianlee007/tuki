import { config } from '../config.js';
import { errorServicioNoDisponible } from '../lib/errores.js';
import type {
  Panorama,
  RestauranteAdmin,
  ResumenPedidos,
  ResumenRestaurantes,
  ResumenUsuarios,
  UsuarioAdmin,
} from '../modulos/admin/admin.types.js';

const base = (url: string) => url.replace(/\/+$/, '');

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

export const panorama = async (token: string): Promise<Panorama> => {
  const [usuarios, restaurantes, pedidos] = await Promise.all([
    solicitar<ResumenUsuarios>(
      `${base(config.IDENTIDAD_URL)}/v1/admin/usuarios/resumen`,
      token,
    ),
    solicitar<ResumenRestaurantes>(
      `${base(config.RESTAURANTES_URL)}/v1/admin/restaurantes/resumen`,
      token,
    ),
    solicitar<ResumenPedidos>(
      `${base(config.PEDIDOS_URL)}/v1/admin/pedidos/resumen`,
      token,
    ),
  ]);
  return { usuarios, restaurantes, pedidos };
};

export const listarRestaurantes = (
  token: string,
  filtros: { q?: string; limite: number; desde: number },
) => {
  const params = new URLSearchParams();
  if (filtros.q) params.set('q', filtros.q);
  params.set('limite', String(filtros.limite));
  params.set('desde', String(filtros.desde));
  return solicitar<{ items: RestauranteAdmin[]; total: number }>(
    `${base(config.RESTAURANTES_URL)}/v1/admin/restaurantes?${params.toString()}`,
    token,
  );
};

export const cambiarEstado = (
  token: string,
  restauranteId: string,
  activo: boolean,
) =>
  solicitar<RestauranteAdmin>(
    `${base(config.RESTAURANTES_URL)}/v1/admin/restaurantes/${restauranteId}/estado`,
    token,
    { method: 'PATCH', body: JSON.stringify({ activo }) },
  );

export const listarUsuarios = (
  token: string,
  filtros: { q?: string; limite: number; desde: number },
) => {
  const params = new URLSearchParams();
  if (filtros.q) params.set('q', filtros.q);
  params.set('limite', String(filtros.limite));
  params.set('desde', String(filtros.desde));
  return solicitar<{ items: UsuarioAdmin[]; total: number }>(
    `${base(config.IDENTIDAD_URL)}/v1/admin/usuarios?${params.toString()}`,
    token,
  );
};

export const cambiarRol = (token: string, usuarioId: string, rol: string) =>
  solicitar<{ usuario: UsuarioAdmin }>(
    `${base(config.IDENTIDAD_URL)}/v1/admin/usuarios/${usuarioId}/rol`,
    token,
    { method: 'PATCH', body: JSON.stringify({ rol }) },
  );
