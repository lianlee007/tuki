import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { CasosDeUsoResenas } from '../../aplicacion/casos-uso.js';
import { errorNoAutorizado } from '../../dominio/errores.js';
import { esquemaCrear, esquemaRespuesta, esquemaVisible } from './resenas.esquemas.js';

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

/** Adaptador de entrada HTTP: Fastify ↔ casos de uso. */
export const crearControlador = (servicios: CasosDeUsoResenas) => ({
  listar: async (request: FastifyRequest, reply: FastifyReply) => {
    const { restauranteId } = z
      .object({ restauranteId: z.string().uuid() })
      .parse(request.params);
    return reply.code(200).send(await servicios.listar(restauranteId));
  },

  crear: async (request: FastifyRequest, reply: FastifyReply) => {
    const entrada = esquemaCrear.parse(request.body);
    return reply.code(201).send(await servicios.crear(usuarioDe(request), entrada));
  },

  mias: async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send({ resenas: await servicios.mias(usuarioDe(request)) });
  },

  eliminar: async (request: FastifyRequest, reply: FastifyReply) => {
    await servicios.eliminar(usuarioDe(request), parametros.parse(request.params).id);
    return reply.code(204).send();
  },

  marcarUtil: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    return reply.code(200).send(await servicios.marcarUtil(usuarioDe(request), id));
  },

  quitarUtil: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    return reply.code(200).send(await servicios.quitarUtil(usuarioDe(request), id));
  },

  responder: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { respuesta } = esquemaRespuesta.parse(request.body);
    return reply
      .code(200)
      .send(await servicios.responder(usuarioDe(request), id, respuesta, tokenDe(request)));
  },

  borrarRespuesta: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    return reply
      .code(200)
      .send(await servicios.borrarRespuesta(usuarioDe(request), id, tokenDe(request)));
  },

  cambiarVisible: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { visible } = esquemaVisible.parse(request.body);
    return reply
      .code(200)
      .send(await servicios.cambiarVisible(usuarioDe(request), id, visible));
  },
});
