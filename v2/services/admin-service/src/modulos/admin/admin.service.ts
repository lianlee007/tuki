import * as clientes from '../../clientes/servicios.cliente.js';
import * as repo from './admin.repository.js';
import type { ContextoAutenticacion } from './admin.types.js';

export const panorama = (token: string) => clientes.panorama(token);

export const restaurantes = (
  token: string,
  filtros: { q?: string; limite: number; desde: number },
) => clientes.listarRestaurantes(token, filtros);

export const cambiarEstado = async (
  usuario: ContextoAutenticacion,
  token: string,
  restauranteId: string,
  activo: boolean,
) => {
  const restaurante = await clientes.cambiarEstado(token, restauranteId, activo);
  await repo.registrar({
    actorId: usuario.usuarioId,
    accion: activo ? 'activar_restaurante' : 'suspender_restaurante',
    entidad: 'restaurante',
    entidadId: restauranteId,
    detalle: { activo },
  });
  return restaurante;
};

export const usuarios = (
  token: string,
  filtros: { q?: string; limite: number; desde: number },
) => clientes.listarUsuarios(token, filtros);

export const cambiarRol = async (
  usuario: ContextoAutenticacion,
  token: string,
  usuarioId: string,
  rol: string,
) => {
  const respuesta = await clientes.cambiarRol(token, usuarioId, rol);
  await repo.registrar({
    actorId: usuario.usuarioId,
    accion: 'cambiar_rol',
    entidad: 'usuario',
    entidadId: usuarioId,
    detalle: { rol },
  });
  return respuesta.usuario;
};

export const auditoria = () => repo.listar(100);
