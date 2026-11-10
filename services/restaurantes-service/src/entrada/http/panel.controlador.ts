import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { CasosDeUsoRestaurantes } from '../../aplicacion/casos-uso.js';
import { errorNoAutorizado } from '../../dominio/errores.js';
import {
  esquemaActualizarRestaurante,
  esquemaCocinas,
  esquemaCrearRestaurante,
  esquemaTema,
} from './restaurantes.esquemas.js';

const parametrosId = z.object({ id: z.string().uuid() });

const usuarioDe = (request: FastifyRequest) => {
  if (!request.usuario) throw errorNoAutorizado('Inicia sesión para continuar.');
  return request.usuario;
};

/** Adaptador de entrada HTTP del panel del dueño. */
export const crearControladorPanel = (casos: CasosDeUsoRestaurantes) => ({
  miRestaurante: async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send(await casos.miRestaurante(usuarioDe(request)));
  },

  crear: async (request: FastifyRequest, reply: FastifyReply) => {
    const entrada = esquemaCrearRestaurante.parse(request.body);
    const creado = await casos.crear(usuarioDe(request), entrada);
    return reply.code(201).send(creado);
  },

  panel: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = parametrosId.parse(request.params);
    return reply.code(200).send(await casos.panel(usuarioDe(request), id));
  },

  actualizar: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = parametrosId.parse(request.params);
    const entrada = esquemaActualizarRestaurante.parse(request.body);
    return reply.code(200).send(await casos.actualizar(usuarioDe(request), id, entrada));
  },

  actualizarTema: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = parametrosId.parse(request.params);
    const entrada = esquemaTema.parse(request.body);
    return reply.code(200).send(await casos.actualizarTema(usuarioDe(request), id, entrada));
  },

  actualizarCocinas: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = parametrosId.parse(request.params);
    const { cocinas } = esquemaCocinas.parse(request.body);
    return reply.code(200).send({
      cocinas: await casos.reemplazarCocinas(usuarioDe(request), id, cocinas),
    });
  },
});
