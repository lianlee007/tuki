import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { CasosDeUsoRestaurantes } from '../../aplicacion/casos-uso.js';
import { esquemaListado, esquemaListadoPlatos } from './restaurantes.esquemas.js';

const parametrosSlug = z.object({ slug: z.string().trim().min(1).max(80) });

/** Adaptador de entrada HTTP de las rutas públicas. */
export const crearControladorPublico = (casos: CasosDeUsoRestaurantes) => ({
  ficha: async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = parametrosSlug.parse(request.params);
    return reply.code(200).send(await casos.fichaPublica(slug));
  },

  listar: async (request: FastifyRequest, reply: FastifyReply) => {
    const filtros = esquemaListado.parse(request.query);
    const { items, total } = await casos.listar(filtros);
    return reply.code(200).send({
      items,
      total,
      desde: filtros.desde,
      limite: filtros.limite,
    });
  },

  buscarPlatos: async (request: FastifyRequest, reply: FastifyReply) => {
    const filtros = esquemaListadoPlatos.parse(request.query);
    const { items, total } = await casos.buscarPlatos(filtros);
    return reply.code(200).send({
      items,
      total,
      desde: filtros.desde,
      limite: filtros.limite,
    });
  },

  cocinas: async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send({ cocinas: await casos.listarCocinas() });
  },

  menuPublico: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    return reply.code(200).send(await casos.menuPublico(id));
  },
});
