import type { Resena } from '@tuki/dominio';
import type { ContextoAutenticacion } from './usuario.js';

export type { Resena };

export interface EntradaResena {
  restauranteId: string;
  platilloId?: string | null;
  nombreCliente: string;
  calificacion: number;
  comentario?: string | null;
  fotoUrl?: string | null;
}

export interface ResumenResenas {
  promedio: number;
  cantidad: number;
}

export const puedeEliminar = (
  usuario: ContextoAutenticacion,
  resena: Resena,
): boolean =>
  resena.usuarioId === usuario.usuarioId || usuario.rol === 'superadmin';

export const puedeResponder = (usuario: ContextoAutenticacion): boolean =>
  usuario.rol === 'dueno' || usuario.rol === 'superadmin';

export const puedeOcultar = (usuario: ContextoAutenticacion): boolean =>
  usuario.rol === 'superadmin';
