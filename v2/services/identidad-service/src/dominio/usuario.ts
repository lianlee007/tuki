/** Roles disponibles en la plataforma. */
export type Rol = 'cliente' | 'dueno' | 'superadmin';

/** Datos que se pueden devolver al frontend sin exponer credenciales. */
export interface UsuarioPublico {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  emailVerificado: boolean;
  creadoEn: Date;
  avatarUrl: string | null;
}

/** Usuario con el hash necesario para validar el inicio de sesión. */
export interface UsuarioConCredenciales extends UsuarioPublico {
  passwordHash: string;
}

/** Identidad que viaja en el JWT y que consumen los demás servicios. */
export interface ContextoAutenticacion {
  usuarioId: string;
  rol: Rol;
  email: string;
}

/** Resultado de un registro, login o refresco. */
export interface SesionCreada {
  usuario: UsuarioPublico;
  accessToken: string;
  refreshToken: string;
  refreshExpiraEn: Date;
}

/** Metadatos de la petición que se guardan con el token de refresco. */
export interface ContextoPeticion {
  userAgent?: string | undefined;
  ip?: string | undefined;
}

export type RolRegistro = Exclude<Rol, 'superadmin'>;

export interface EntradaRegistro {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: RolRegistro;
}

export interface EntradaLogin {
  email: string;
  password: string;
}

export interface EntradaActualizarPerfil {
  nombre?: string;
  apellido?: string;
  avatarUrl?: string | null;
}

export interface EntradaCrearUsuario {
  email: string;
  passwordHash: string;
  nombre: string;
  apellido: string;
  rol: Rol;
}

export interface EntradaCrearSuperadmin {
  email: string;
  password: string;
  nombre?: string;
  apellido?: string;
}

export interface FiltrosUsuarios {
  q?: string;
  limite: number;
  desde: number;
}
