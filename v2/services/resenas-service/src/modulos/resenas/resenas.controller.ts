import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { errorNoAutorizado } from '../../lib/errores.js';
import { esquemaCrear, esquemaRespuesta, esquemaVisible } from './resenas.schema.js';
import * as servicio from './resenas.service.js';

const parametros = z.object({
  id: z.string().uuid(),
  restauranteId: z.string().uuid(),
});

const usuarioDe = (request: FastifyRequest) => {
  if (!request.usuario) throw errorNoAutorizado('Inicia sesión para continuar.');
  return request.usuario;
};

const tokenDe = (request: FastifyRequest): string => {
  const encabezado = request.headers.authorization ?? '';
  return encabezado.startsWith('Bearer ') ? encabezado.slice(7).trim() : '';
};

export const listar = async (request: FastifyRequest, reply: FastifyReply) => {
  const { restauranteId } = z
    .object({ restauranteId: z.string().uuid() })
    .parse(request.params);
  return reply.code(200).send(await servicio.listar(restauranteId));
};

export const crear = async (request: FastifyRequest, reply: FastifyReply) => {
  const entrada = esquemaCrear.parse(request.body);
  return reply.code(201).send(await servicio.crear(usuarioDe(request), entrada));
};

export const mias = async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.code(200).send({ resenas: await servicio.mias(usuarioDe(request)) });
};

export const eliminar = async (request: FastifyRequest, reply: FastifyReply) => {
  await servicio.eliminar(usuarioDe(request), parametros.parse(request.params).id);
  return reply.code(204).send();
};

export const marcarUtil = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  return reply.code(200).send(await servicio.marcarUtil(usuarioDe(request), id));
};

export const quitarUtil = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  return reply.code(200).send(await servicio.quitarUtil(usuarioDe(request), id));
};

export const responder = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const { respuesta } = esquemaRespuesta.parse(request.body);
  return reply
    .code(200)
    .send(await servicio.responder(usuarioDe(request), id, respuesta, tokenDe(request)));
};

/** Elimina la respuesta del dueño y devuelve la reseña actualizada. */
export const borrarRespuesta = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  return reply
    .code(200)
    .send(await servicio.borrarRespuesta(usuarioDe(request), id, tokenDe(request)));
};

export const cambiarVisible = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const { visible } = esquemaVisible.parse(request.body);
  return reply
    .code(200)
    .send(await servicio.cambiarVisible(usuarioDe(request), id, visible));
};
