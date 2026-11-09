import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { CasosDeUsoPedidos } from '../../aplicacion/casos-uso.js';
import { errorNoAutorizado } from '../../dominio/errores.js';
import { esquemaCrearPedido, esquemaEstado } from './pedidos.esquemas.js';

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

/** Adaptador de entrada HTTP: traduce Fastify a casos de uso y viceversa. */
export const crearControlador = (servicios: CasosDeUsoPedidos) => ({
  crear: async (request: FastifyRequest, reply: FastifyReply) => {
    const entrada = esquemaCrearPedido.parse(request.body);
    return reply.code(201).send(await servicios.crear(usuarioDe(request), entrada));
  },

  mios: async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send({ pedidos: await servicios.mios(usuarioDe(request)) });
  },

  porRestaurante: async (request: FastifyRequest, reply: FastifyReply) => {
    const { restauranteId } = parametrosRestaurante.parse(request.params);
    const pedidos = await servicios.porRestaurante(
      usuarioDe(request),
      restauranteId,
      tokenDe(request),
    );
    return reply.code(200).send({ pedidos });
  },

  obtener: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = parametrosPedido.parse(request.params);
    return reply
      .code(200)
      .send(await servicios.obtener(usuarioDe(request), id, tokenDe(request)));
  },

  cambiarEstado: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = parametrosPedido.parse(request.params);
    const { estado } = esquemaEstado.parse(request.body);
    return reply
      .code(200)
      .send(await servicios.cambiarEstado(usuarioDe(request), id, estado, tokenDe(request)));
  },

  resumenAdmin: async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send(await servicios.resumenAdmin());
  },
});
