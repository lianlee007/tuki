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

/** Fila cruda de PostgreSQL; el mapeo vive en el repositorio. */
export interface FilaUsuario {
  id: string;
  email: string;
  password_hash: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  email_verificado_en: Date | null;
  creado_en: Date;
}
