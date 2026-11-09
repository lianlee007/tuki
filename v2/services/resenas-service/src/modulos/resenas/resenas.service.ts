import { errorNoEncontrado, errorProhibido } from '../../lib/errores.js';
import { verificarPropietario, verificarRestaurante } from '../../clientes/restaurantes.cliente.js';
import * as repo from './resenas.repository.js';
import type { ContextoAutenticacion } from './resenas.types.js';
import type { z } from 'zod';
import type { esquemaCrear } from './resenas.schema.js';

type EntradaCrear = z.infer<typeof esquemaCrear>;

export const listar = async (restauranteId: string) => {
  const [resenas, resumen] = await Promise.all([
    repo.listarPorRestaurante(restauranteId),
    repo.resumen(restauranteId),
  ]);
  return { resenas, resumen };
};

export const crear = async (
  usuario: ContextoAutenticacion,
  entrada: EntradaCrear,
) => {
  await verificarRestaurante(entrada.restauranteId);
  return repo.crear({
    ...entrada,
    usuarioId: usuario.usuarioId,
    platilloId: entrada.platilloId ?? null,
    comentario: entrada.comentario ?? null,
    fotoUrl: entrada.fotoUrl ?? null,
  });
};

export const mias = (usuario: ContextoAutenticacion) =>
  repo.listarPorUsuario(usuario.usuarioId);

export const eliminar = async (usuario: ContextoAutenticacion, id: string) => {
  const resena = await repo.buscarPorId(id);
  if (!resena) throw errorNoEncontrado('No encontramos la reseña.');
  if (resena.usuarioId !== usuario.usuarioId && usuario.rol !== 'superadmin') {
    throw errorProhibido('Solo puedes eliminar tus propias reseñas.');
  }
  await repo.eliminar(id);
};

export const marcarUtil = async (usuario: ContextoAutenticacion, id: string) => {
  const resena = await repo.buscarPorId(id);
  if (!resena) throw errorNoEncontrado('No encontramos la reseña.');
  await repo.marcarUtil(id, usuario.usuarioId);
  return repo.buscarPorId(id);
};

export const quitarUtil = async (usuario: ContextoAutenticacion, id: string) => {
  await repo.quitarUtil(id, usuario.usuarioId);
  return repo.buscarPorId(id);
};

export const responder = async (
  usuario: ContextoAutenticacion,
  id: string,
  respuesta: string,
  token: string,
) => {
  const resena = await repo.buscarPorId(id);
  if (!resena) throw errorNoEncontrado('No encontramos la reseña.');
  if (usuario.rol !== 'dueno' && usuario.rol !== 'superadmin') {
    throw errorProhibido('Solo el dueño puede responder una reseña.');
  }
  if (usuario.rol === 'dueno') {
    await verificarPropietario(resena.restauranteId, token);
  }
  return repo.responder(id, respuesta);
};

/** Borra la respuesta pública del dueño sin eliminar la reseña. */
export const borrarRespuesta = async (
  usuario: ContextoAutenticacion,
  id: string,
  token: string,
) => {
  const resena = await repo.buscarPorId(id);
  if (!resena) throw errorNoEncontrado('No encontramos la reseña.');
  if (usuario.rol !== 'dueno' && usuario.rol !== 'superadmin') {
    throw errorProhibido('Solo el dueño puede responder una reseña.');
  }
  if (usuario.rol === 'dueno') {
    await verificarPropietario(resena.restauranteId, token);
  }
  return repo.borrarRespuesta(id);
};

export const cambiarVisible = async (usuario: ContextoAutenticacion, id: string, visible: boolean) => {
  if (usuario.rol !== 'superadmin') {
    throw errorProhibido('Solo el superadmin puede ocultar una reseña.');
  }
  const resena = await repo.cambiarVisible(id, visible);
  if (!resena) throw errorNoEncontrado('No encontramos la reseña.');
  return resena;
};
