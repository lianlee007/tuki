import type { EntradaLogin, EntradaRegistro, Sesion, Usuario } from '@tuki/dominio';
import type { ClienteHttp } from './http.js';

/**
 * Contrato del servicio de identidad.
 *
 * Mantiene los mismos nombres que usaba la capa de Supabase para que los
 * componentes existentes se puedan migrar cambiando solo la implementación.
 */
export const crearApiIdentidad = (http: ClienteHttp) => ({
  registrar: (entrada: EntradaRegistro): Promise<Sesion> =>
    http.solicitar<Sesion>('/v1/identidad/registro', {
      method: 'POST',
      body: JSON.stringify(entrada),
    }),

  login: (entrada: EntradaLogin): Promise<Sesion> =>
    http.solicitar<Sesion>('/v1/identidad/login', {
      method: 'POST',
      body: JSON.stringify(entrada),
    }),

  refrescar: (refreshToken: string): Promise<Sesion> =>
    http.solicitar<Sesion>('/v1/identidad/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  cerrarSesion: (refreshToken: string): Promise<void> =>
    http.solicitar<void>('/v1/identidad/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  perfil: (): Promise<{ usuario: Usuario }> =>
    http.solicitar<{ usuario: Usuario }>('/v1/identidad/perfil'),

  actualizarPerfil: (entrada: {
    nombre?: string;
    apellido?: string;
    avatarUrl?: string | null;
  }): Promise<{ usuario: Usuario }> =>
    http.solicitar<{ usuario: Usuario }>('/v1/identidad/perfil', {
      method: 'PATCH',
      body: JSON.stringify(entrada),
    }),
});
