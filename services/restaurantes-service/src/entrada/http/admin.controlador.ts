import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { CasosDeUsoRestaurantes } from '../../aplicacion/casos-uso.js';
import {
  esquemaEstadoRestaurante,
  esquemaListadoAdmin,
} from './restaurantes.esquemas.js';

const parametros = z.object({ id: z.string().uuid() });

/** Adaptador de entrada HTTP de administración de restaurantes. */
export const crearControladorAdmin = (casos: CasosDeUsoRestaurantes) => ({
  listar: async (request: FastifyRequest, reply: FastifyReply) => {
    const filtros = esquemaListadoAdmin.parse(request.query);
    const { items, total } = await casos.listarTodosAdmin(filtros);
    return reply.code(200).send({
      items,
      total,
      desde: filtros.desde,
      limite: filtros.limite,
    });
  },

  resumen: async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send(await casos.resumenAdmin());
  },

  cambiarEstado: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = parametros.parse(request.params);
    const { activo } = esquemaEstadoRestaurante.parse(request.body);
    return reply.code(200).send(await casos.cambiarActivo(id, activo));
  },
});
