import { cambiarEstadoRestaurante } from './cambiar-estado-restaurante.js';
import { cambiarRolUsuario } from './cambiar-rol-usuario.js';
import { consultarPanorama } from './consultar-panorama.js';
import { listarAuditoria } from './listar-auditoria.js';
import { listarRestaurantes } from './listar-restaurantes.js';
import { listarUsuarios } from './listar-usuarios.js';
import type { AuditoriaRepositorio } from '../puertos/auditoria.repositorio.js';
import type { ServiciosRemotos } from '../puertos/servicios.remotos.js';

interface Dependencias {
  remotos: ServiciosRemotos;
  auditoria: AuditoriaRepositorio;
}

/** Contrato que consume la capa HTTP. */
export interface CasosDeUsoAdmin {
  panorama: ReturnType<typeof consultarPanorama>;
  restaurantes: ReturnType<typeof listarRestaurantes>;
  cambiarEstado: ReturnType<typeof cambiarEstadoRestaurante>;
  usuarios: ReturnType<typeof listarUsuarios>;
  cambiarRol: ReturnType<typeof cambiarRolUsuario>;
  auditoria: ReturnType<typeof listarAuditoria>;
}

/** Raíz de composición: casos de uso + adaptadores concretos. */
export const crearCasosDeUsoAdmin = (
  dependencias: Dependencias,
): CasosDeUsoAdmin => ({
  panorama: consultarPanorama(dependencias),
  restaurantes: listarRestaurantes(dependencias),
  cambiarEstado: cambiarEstadoRestaurante(dependencias),
  usuarios: listarUsuarios(dependencias),
  cambiarRol: cambiarRolUsuario(dependencias),
  auditoria: listarAuditoria(dependencias),
});
