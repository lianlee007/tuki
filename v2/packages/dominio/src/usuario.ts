import type { Rol } from './rol.js';

/** Cuenta tal como la devuelve el servicio de identidad. */
export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  emailVerificado: boolean;
  creadoEn: string;
  avatarUrl?: string | null;
}

/** Sesión completa que entrega el login. */
export interface Sesion {
  usuario: Usuario;
  accessToken: string;
  refreshToken: string;
  refreshExpiraEn: string;
}

export interface EntradaRegistro {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol?: 'cliente' | 'dueno';
}

export interface EntradaLogin {
  email: string;
  password: string;
}
