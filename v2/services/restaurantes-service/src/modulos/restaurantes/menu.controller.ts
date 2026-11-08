import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { errorNoAutorizado } from '../../lib/errores.js';
import {
  esquemaCategoria,
  esquemaDisponibilidad,
  esquemaPlatillo,
} from './restaurantes.schema.js';
import * as servicio from './menu.service.js';

const parametrosLocal = z.object({ id: z.string().uuid() });
const parametrosCategoria = parametrosLocal.extend({ categoriaId: z.string().uuid() });
const parametrosPlatillo = parametrosLocal.extend({ platilloId: z.string().uuid() });

const usuarioDe = (request: FastifyRequest) => {
  if (!request.usuario) throw errorNoAutorizado('Inicia sesión para continuar.');
  return request.usuario;
};

export const listarCategorias = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = parametrosLocal.parse(request.params);
  return reply.code(200).send({
    categorias: await servicio.listarCategorias(usuarioDe(request), id),
  });
};

export const crearCategoria = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = parametrosLocal.parse(request.params);
  const entrada = esquemaCategoria.parse(request.body);
  return reply
    .code(201)
    .send(await servicio.crearCategoria(usuarioDe(request), id, entrada));
};

export const actualizarCategoria = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { id, categoriaId } = parametrosCategoria.parse(request.params);
  const entrada = esquemaCategoria.partial().parse(request.body);
  return reply
    .code(200)
    .send(await servicio.actualizarCategoria(usuarioDe(request), id, categoriaId, entrada));
};

export const eliminarCategoria = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id, categoriaId } = parametrosCategoria.parse(request.params);
  await servicio.eliminarCategoria(usuarioDe(request), id, categoriaId);
  return reply.code(204).send();
};

export const listarPlatillos = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = parametrosLocal.parse(request.params);
  return reply.code(200).send({
    platillos: await servicio.listarPlatillos(usuarioDe(request), id),
  });
};

export const crearPlatillo = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = parametrosLocal.parse(request.params);
  const entrada = esquemaPlatillo.parse(request.body);
  return reply.code(201).send(await servicio.crearPlatillo(usuarioDe(request), id, entrada));
};

export const actualizarPlatillo = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { id, platilloId } = parametrosPlatillo.parse(request.params);
  const entrada = esquemaPlatillo.partial().parse(request.body);
  return reply
    .code(200)
    .send(await servicio.actualizarPlatillo(usuarioDe(request), id, platilloId, entrada));
};

export const eliminarPlatillo = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id, platilloId } = parametrosPlatillo.parse(request.params);
  await servicio.eliminarPlatillo(usuarioDe(request), id, platilloId);
  return reply.code(204).send();
};

export const disponibilidad = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id, platilloId } = parametrosPlatillo.parse(request.params);
  const { disponible } = esquemaDisponibilidad.parse(request.body);
  return reply
    .code(200)
    .send(
      await servicio.cambiarDisponibilidad(
        usuarioDe(request),
        id,
        platilloId,
        disponible,
      ),
    );
};
