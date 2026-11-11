import type { Rol } from '@tuki/dominio';

export type Vista = 'panorama' | 'restaurantes' | 'usuarios' | 'auditoria';

export const VISTAS: Vista[] = ['panorama', 'restaurantes', 'usuarios', 'auditoria'];

export type AccionPendiente =
  | {
      tipo: 'restaurante';
      id: string;
      nombre: string;
      activo: boolean;
    }
  | {
      tipo: 'rol';
      id: string;
      nombre: string;
      rolActual: Rol;
      rolNuevo: Rol;
    };
