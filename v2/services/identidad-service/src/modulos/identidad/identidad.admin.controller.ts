import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import * as servicio from './identidad.service.js';
import { esquemaListadoUsuarios, esquemaRol } from './identidad.schema.js';

const parametros = z.object({ id: z.string().uuid() });

export const listar = async (request: FastifyRequest, reply: FastifyReply) => {
  const filtros = esquemaListadoUsuarios.parse(request.query);
  const { items, total } = await servicio.listarUsuarios(filtros);
  return reply.code(200).send({
    items,
    total,
    desde: filtros.desde,
    limite: filtros.limite,
  });
};

export const resumen = async (_request: FastifyRequest, reply: FastifyReply) => {
  return reply.code(200).send(await servicio.resumenUsuarios());
};

export const cambiarRol = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = parametros.parse(request.params);
  const { rol } = esquemaRol.parse(request.body);
  return reply.code(200).send({ usuario: await servicio.cambiarRol(id, rol) });
};
