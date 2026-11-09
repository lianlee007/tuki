import { actualizarPerfil } from './actualizar-perfil.js';
import { cambiarRol } from './cambiar-rol.js';
import { cerrarSesion } from './cerrar-sesion.js';
import { crearSuperadmin } from './crear-superadmin.js';
import type { DependenciasIdentidad } from './dependencias.js';
import { iniciarSesion } from './iniciar-sesion.js';
import { listarUsuarios } from './listar-usuarios.js';
import { obtenerPerfil } from './obtener-perfil.js';
import { refrescar } from './refrescar.js';
import { registrar } from './registrar.js';
import { resumenUsuarios } from './resumen-usuarios.js';

/** Contrato que consume la capa HTTP y el script de superadmin. */
export interface CasosDeUsoIdentidad {
  registrar: ReturnType<typeof registrar>;
  iniciarSesion: ReturnType<typeof iniciarSesion>;
  refrescar: ReturnType<typeof refrescar>;
  cerrarSesion: ReturnType<typeof cerrarSesion>;
  obtenerPerfil: ReturnType<typeof obtenerPerfil>;
  actualizarPerfil: ReturnType<typeof actualizarPerfil>;
  crearSuperadmin: ReturnType<typeof crearSuperadmin>;
  listarUsuarios: ReturnType<typeof listarUsuarios>;
  resumenUsuarios: ReturnType<typeof resumenUsuarios>;
  cambiarRol: ReturnType<typeof cambiarRol>;
}

/** Raíz de composición: casos de uso + puertos inyectados. */
export const crearCasosDeUsoIdentidad = (
  dependencias: DependenciasIdentidad,
): CasosDeUsoIdentidad => ({
  registrar: registrar(dependencias),
  iniciarSesion: iniciarSesion(dependencias),
  refrescar: refrescar(dependencias),
  cerrarSesion: cerrarSesion(dependencias),
  obtenerPerfil: obtenerPerfil(dependencias),
  actualizarPerfil: actualizarPerfil(dependencias),
  crearSuperadmin: crearSuperadmin(dependencias),
  listarUsuarios: listarUsuarios(dependencias),
  resumenUsuarios: resumenUsuarios(dependencias),
  cambiarRol: cambiarRol(dependencias),
});
