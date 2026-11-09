import type {
  EntradaCrearUsuario,
  FiltrosUsuarios,
  Rol,
  UsuarioConCredenciales,
  UsuarioPublico,
} from '../dominio/usuario.js';

export interface RefreshVigente {
  usuario: UsuarioPublico;
  expiraEn: Date;
}

export interface ResultadoListadoUsuarios {
  items: UsuarioPublico[];
  total: number;
}

export interface EntradaGuardarRefresh {
  usuarioId: string;
  tokenHash: string;
  expiraEn: Date;
  userAgent?: string | undefined;
  ip?: string | undefined;
}

export interface EntradaActualizarCredenciales {
  usuarioId: string;
  passwordHash: string;
  rol?: Rol | undefined;
}

export interface EntradaActualizarPerfil {
  usuarioId: string;
  nombre?: string | undefined;
  apellido?: string | undefined;
  avatarUrl?: string | null | undefined;
}

/** Puerto de persistencia de cuentas y tokens de refresco. */
export interface UsuariosRepositorio {
  crearUsuario(entrada: EntradaCrearUsuario): Promise<UsuarioPublico>;
  buscarPorEmail(email: string): Promise<UsuarioConCredenciales | null>;
  buscarPorId(id: string): Promise<UsuarioPublico | null>;
  guardarRefreshToken(entrada: EntradaGuardarRefresh): Promise<void>;
  buscarRefreshVigente(tokenHash: string): Promise<RefreshVigente | null>;
  revocarRefreshToken(tokenHash: string): Promise<void>;
  actualizarCredenciales(entrada: EntradaActualizarCredenciales): Promise<void>;
  actualizarPerfil(entrada: EntradaActualizarPerfil): Promise<UsuarioPublico | null>;
  listarUsuarios(filtros: FiltrosUsuarios): Promise<ResultadoListadoUsuarios>;
  resumenUsuarios(): Promise<Record<Rol, number>>;
  cambiarRol(id: string, rol: Rol): Promise<UsuarioPublico | null>;
}
