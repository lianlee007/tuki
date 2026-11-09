import { errorConflicto, errorNoAutorizado, errorNoEncontrado } from '../../lib/errores.js';
import { hashearPassword, verificarPassword } from '../../lib/password.js';
import { crearRefreshToken, firmarAcceso, hashearToken } from '../../lib/tokens.js';
import { esViolacionUnica } from '../../lib/db-errores.js';
import * as repositorio from './identidad.repository.js';
import type { EntradaLogin, EntradaRegistro } from './identidad.schema.js';
import type {
  ContextoAutenticacion,
  Rol,
  SesionCreada,
  UsuarioConCredenciales,
  UsuarioPublico,
} from './identidad.types.js';

/** Metadatos de la petición que se guardan con el token de refresco. */
export interface ContextoPeticion {
  userAgent?: string | undefined;
  ip?: string | undefined;
}

/**
 * Crea una sesión completa: token de acceso, token de refresco y registro del
 * dispositivo. El refresco se guarda como hash, nunca en claro.
 */
const crearSesion = async (
  usuario: UsuarioPublico,
  contexto: ContextoPeticion,
): Promise<SesionCreada> => {
  const refresco = crearRefreshToken();
  await repositorio.guardarRefreshToken({
    usuarioId: usuario.id,
    tokenHash: refresco.hash,
    expiraEn: refresco.expiraEn,
    userAgent: contexto.userAgent,
    ip: contexto.ip,
  });

  const accessToken = await firmarAcceso({
    usuarioId: usuario.id,
    rol: usuario.rol,
    email: usuario.email,
  });

  return {
    usuario,
    accessToken,
    refreshToken: refresco.token,
    refreshExpiraEn: refresco.expiraEn,
  };
};

/** Registro público. Solo permite los roles cliente y dueño. */
export const registrar = async (
  entrada: EntradaRegistro,
  contexto: ContextoPeticion,
): Promise<SesionCreada> => {
  const existente = await repositorio.buscarPorEmail(entrada.email);
  if (existente) {
    throw errorConflicto('Ese correo ya tiene una cuenta.');
  }

  const passwordHash = await hashearPassword(entrada.password);
  let usuario: UsuarioPublico;
  try {
    usuario = await repositorio.crearUsuario({
      email: entrada.email,
      passwordHash,
      nombre: entrada.nombre,
      apellido: entrada.apellido,
      rol: entrada.rol,
    });
  } catch (error) {
    if (esViolacionUnica(error)) {
      throw errorConflicto('Ese correo ya tiene una cuenta.');
    }
    throw error;
  }

  await repositorio.registrarAuditoria({
    usuarioId: usuario.id,
    accion: 'registro',
    detalle: { rol: usuario.rol },
  });

  return crearSesion(usuario, contexto);
};

/** Inicio de sesión con correo y contraseña. */
export const iniciarSesion = async (
  entrada: EntradaLogin,
  contexto: ContextoPeticion,
): Promise<SesionCreada> => {
  const usuario = await repositorio.buscarPorEmail(entrada.email);
  const valida = usuario
    ? await verificarPassword(usuario.passwordHash, entrada.password)
    : false;

  if (!usuario || !valida) {
    await repositorio.registrarAuditoria({
      accion: 'login_fallido',
      detalle: { email: entrada.email },
    });
    throw errorNoAutorizado('Correo o contraseña incorrectos.');
  }

  await repositorio.registrarAuditoria({
    usuarioId: usuario.id,
    accion: 'login',
  });

  return crearSesion(usuario, contexto);
};

/** Rota el refresco: invalida el anterior y entrega uno nuevo. */
export const refrescar = async (
  refreshToken: string,
  contexto: ContextoPeticion,
): Promise<SesionCreada> => {
  const hash = hashearToken(refreshToken);
  const vigente = await repositorio.buscarRefreshVigente(hash);
  if (!vigente) {
    throw errorNoAutorizado('La sesión expiró. Vuelve a iniciar sesión.');
  }

  await repositorio.revocarRefreshToken(hash);
  return crearSesion(vigente.usuario, contexto);
};

/** Cierra la sesión del dispositivo actual. */
export const cerrarSesion = async (refreshToken: string): Promise<void> => {
  await repositorio.revocarRefreshToken(hashearToken(refreshToken));
};

/** Perfil del usuario autenticado. */
export const obtenerPerfil = async (usuarioId: string): Promise<UsuarioPublico> => {
  const usuario = await repositorio.buscarPorId(usuarioId);
  if (!usuario) throw errorNoEncontrado('No encontramos la cuenta.');
  return usuario;
};

/** Actualiza nombre, apellido o foto de la propia cuenta. */
export const actualizarPerfil = async (
  usuario: ContextoAutenticacion,
  entrada: { nombre?: string; apellido?: string; avatarUrl?: string | null },
): Promise<UsuarioPublico> => {
  const actualizado = await repositorio.actualizarPerfil({
    usuarioId: usuario.usuarioId,
    ...entrada,
  });
  if (!actualizado) throw errorNoEncontrado('No encontramos la cuenta.');
  return actualizado;
};

/**
 * Crea o actualiza el superadmin inicial.
 *
 * Solo lo usa el script de arranque; no existe una ruta pública que permita
 * asignar este rol.
 */
export const crearSuperadmin = async (entrada: {
  email: string;
  password: string;
  nombre?: string;
  apellido?: string;
}): Promise<UsuarioPublico> => {  const existente = await repositorio.buscarPorEmail(entrada.email);
  const passwordHash = await hashearPassword(entrada.password);

  if (existente) {
    await repositorio.actualizarCredenciales({
      usuarioId: existente.id,
      passwordHash,
      rol: 'superadmin' as Rol,
    });
    const { passwordHash: _passwordHash, ...publico } = existente;
    return { ...publico, rol: 'superadmin' as Rol };
  }

  return repositorio.crearUsuario({
    email: entrada.email,
    passwordHash,
    nombre: entrada.nombre ?? 'Super',
    apellido: entrada.apellido ?? 'Admin',
    rol: 'superadmin',
  });
};

/** Listado de cuentas para el panel de administración. */
export const listarUsuarios = repositorio.listarUsuarios;

/** Conteo de cuentas por rol. */
export const resumenUsuarios = repositorio.resumenUsuarios;

/** Cambia el rol y deja rastro en auditoría. */
export const cambiarRol = async (id: string, rol: Rol): Promise<UsuarioPublico> => {
  const usuario = await repositorio.cambiarRol(id, rol);
  if (!usuario) throw errorNoEncontrado('No encontramos la cuenta.');
  await repositorio.registrarAuditoria({
    usuarioId: id,
    accion: 'cambio_rol',
    detalle: { rol },
  });
  return usuario;
};
