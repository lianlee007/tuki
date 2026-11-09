import { crearTokensSesion } from './adaptadores/jwt/tokens.js';
import { crearRepositorioAuditoria } from './adaptadores/postgres/auditoria.repositorio.js';
import { crearRepositorioUsuarios } from './adaptadores/postgres/usuarios.repositorio.js';
import { crearHasherPassword } from './adaptadores/seguridad/password.js';
import { crearCasosDeUsoIdentidad } from './aplicacion/casos-uso.js';

/**
 * Raíz de composición del servicio.
 *
 * Une adaptadores concretos (PostgreSQL, Argon2, JWT) con los casos de uso.
 * El script de superadmin reutiliza la misma composición.
 */
export const crearServiciosIdentidad = () => {
  const usuarios = crearRepositorioUsuarios();
  const auditoria = crearRepositorioAuditoria();
  const hasher = crearHasherPassword();
  const tokens = crearTokensSesion();

  return {
    casos: crearCasosDeUsoIdentidad({ usuarios, auditoria, hasher, tokens }),
    tokens,
  };
};
