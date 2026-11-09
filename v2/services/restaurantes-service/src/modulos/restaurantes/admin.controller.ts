import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { esquemaEstadoRestaurante, esquemaListadoAdmin } from './restaurantes.schema.js';
import * as servicio from './restaurantes.service.js';

const parametros = z.object({ id: z.string().uuid() });

export const listar = async (request: FastifyRequest, reply: FastifyReply) => {
  const filtros = esquemaListadoAdmin.parse(request.query);
  const { items, total } = await servicio.listarTodosAdmin(filtros);
  return reply.code(200).send({
    items,
    total,
    desde: filtros.desde,
    limite: filtros.limite,
  });
};

export const resumen = async (_request: FastifyRequest, reply: FastifyReply) => {
  return reply.code(200).send(await servicio.resumenAdmin());
};

export const cambiarEstado = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = parametros.parse(request.params);
  const { activo } = esquemaEstadoRestaurante.parse(request.body);
  return reply.code(200).send(await servicio.cambiarActivo(id, activo));
};
