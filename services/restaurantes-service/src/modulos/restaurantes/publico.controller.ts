import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { esquemaListado, esquemaListadoPlatos } from './restaurantes.schema.js';
import * as servicio from './restaurantes.service.js';

const parametrosSlug = z.object({ slug: z.string().trim().min(1).max(80) });

export const ficha = async (request: FastifyRequest, reply: FastifyReply) => {
  const { slug } = parametrosSlug.parse(request.params);
  return reply.code(200).send(await servicio.fichaPublica(slug));
};

export const listar = async (request: FastifyRequest, reply: FastifyReply) => {
  const filtros = esquemaListado.parse(request.query);
  const { items, total } = await servicio.listar(filtros);
  return reply.code(200).send({
    items,
    total,
    desde: filtros.desde,
    limite: filtros.limite,
  });
};

export const buscarPlatos = async (request: FastifyRequest, reply: FastifyReply) => {
  const filtros = esquemaListadoPlatos.parse(request.query);
  const { items, total } = await servicio.buscarPlatos(filtros);
  return reply.code(200).send({
    items,
    total,
    desde: filtros.desde,
    limite: filtros.limite,
  });
};

export const cocinas = async (_request: FastifyRequest, reply: FastifyReply) => {
  return reply.code(200).send({ cocinas: await servicio.listarCocinas() });
};
