import type { Restaurante, Rol, Usuario } from '@tuki/dominio';
import type { ClienteHttp } from './http.js';

export interface RestauranteAdmin extends Restaurante {
  duenoId: string;
}

export interface Panorama {
  usuarios: Record<Rol, number>;
  restaurantes: { total: number; activos: number };
  pedidos: { total: number; pendientes: number; ingresos: number };
}

export interface Auditoria {
  id: string;
  actorId: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  detalle: Record<string, unknown>;
  creadoEn: string;
}

const consulta = (filtros: Record<string, unknown>): string => {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      params.set(clave, String(valor));
    }
  }
  const texto = params.toString();
  return texto ? `?${texto}` : '';
};

/** Contrato del BFF de administración. */
export const crearApiAdmin = (http: ClienteHttp) => ({
  panorama: () => http.solicitar<Panorama>('/v1/admin/panorama'),

  restaurantes: (filtros: { q?: string; limite?: number; desde?: number } = {}) =>
    http.solicitar<{ items: RestauranteAdmin[]; total: number }>(
      `/v1/admin/restaurantes${consulta(filtros)}`,
    ),

  cambiarEstado: (restauranteId: string, activo: boolean) =>
    http.solicitar<RestauranteAdmin>(
      `/v1/admin/restaurantes/${encodeURIComponent(restauranteId)}/estado`,
      { method: 'PATCH', body: JSON.stringify({ activo }) },
    ),

  usuarios: (filtros: { q?: string; limite?: number; desde?: number } = {}) =>
    http.solicitar<{ items: Usuario[]; total: number }>(
      `/v1/admin/usuarios${consulta(filtros)}`,
    ),

  cambiarRol: (usuarioId: string, rol: Rol) =>
    http.solicitar<{ usuario: Usuario }>(
      `/v1/admin/usuarios/${encodeURIComponent(usuarioId)}/rol`,
      { method: 'PATCH', body: JSON.stringify({ rol }) },
    ),

  auditoria: () =>
    http.solicitar<{ items: Auditoria[] }>('/v1/admin/auditoria'),
});
