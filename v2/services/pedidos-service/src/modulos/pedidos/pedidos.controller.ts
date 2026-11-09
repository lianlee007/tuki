import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { errorNoAutorizado } from '../../lib/errores.js';
import { esquemaCrearPedido, esquemaEstado } from './pedidos.schema.js';
import * as servicio from './pedidos.service.js';

const parametrosPedido = z.object({ id: z.string().uuid() });
const parametrosRestaurante = z.object({ restauranteId: z.string().uuid() });

const usuarioDe = (request: FastifyRequest) => {
  if (!request.usuario) throw errorNoAutorizado('Inicia sesión para continuar.');
  return request.usuario;
};

const tokenDe = (request: FastifyRequest): string => {
  const encabezado = request.headers.authorization ?? '';
  return encabezado.startsWith('Bearer ') ? encabezado.slice(7).trim() : '';
};

export const crear = async (request: FastifyRequest, reply: FastifyReply) => {
  const entrada = esquemaCrearPedido.parse(request.body);
  return reply.code(201).send(await servicio.crear(usuarioDe(request), entrada));
};

export const mios = async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.code(200).send({ pedidos: await servicio.mios(usuarioDe(request)) });
};

export const porRestaurante = async (request: FastifyRequest, reply: FastifyReply) => {
  const { restauranteId } = parametrosRestaurante.parse(request.params);
  const pedidos = await servicio.porRestaurante(
    usuarioDe(request),
    restauranteId,
    tokenDe(request),
  );
  return reply.code(200).send({ pedidos });
};

export const obtener = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = parametrosPedido.parse(request.params);
  return reply
    .code(200)
    .send(await servicio.obtener(usuarioDe(request), id, tokenDe(request)));
};

export const cambiarEstado = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = parametrosPedido.parse(request.params);
  const { estado } = esquemaEstado.parse(request.body);
  return reply
    .code(200)
    .send(await servicio.cambiarEstado(usuarioDe(request), id, estado, tokenDe(request)));
};

export const resumenAdmin = async (_request: FastifyRequest, reply: FastifyReply) => {
  return reply.code(200).send(await servicio.resumenAdmin());
};
