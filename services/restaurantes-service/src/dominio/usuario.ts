import type { Rol } from '@tuki/dominio';

/** Identidad que llega en el JWT emitido por identidad-service. */
export interface ContextoAutenticacion {
  usuarioId: string;
  rol: Rol;
  email: string;
}

export const esDuenoOSuperadmin = (usuario: ContextoAutenticacion): boolean =>
  usuario.rol === 'dueno' || usuario.rol === 'superadmin';
