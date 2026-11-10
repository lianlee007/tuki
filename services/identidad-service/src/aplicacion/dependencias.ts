import type { AuditoriaRepositorio } from '../puertos/auditoria.repositorio.js';
import type { HasherPassword } from '../puertos/hasher-password.js';
import type { TokensSesion } from '../puertos/tokens-sesion.js';
import type { UsuariosRepositorio } from '../puertos/usuarios.repositorio.js';

/** Dependencias comunes de los casos de uso de identidad. */
export interface DependenciasIdentidad {
  usuarios: UsuariosRepositorio;
  auditoria: AuditoriaRepositorio;
  hasher: HasherPassword;
  tokens: TokensSesion;
}
