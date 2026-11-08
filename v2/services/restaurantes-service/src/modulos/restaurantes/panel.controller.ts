import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { errorNoAutorizado } from '../../lib/errores.js';
import {
  esquemaActualizarRestaurante,
  esquemaCocinas,
  esquemaCrearRestaurante,
  esquemaTema,
} from './restaurantes.schema.js';
import * as servicio from './restaurantes.service.js';

const parametrosId = z.object({ id: z.string().uuid() });

const usuarioDe = (request: FastifyRequest) => {
  if (!request.usuario) throw errorNoAutorizado('Inicia sesión para continuar.');
  return request.usuario;
};

export const miRestaurante = async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.code(200).send(await servicio.miRestaurante(usuarioDe(request)));
};

export const crear = async (request: FastifyRequest, reply: FastifyReply) => {
  const entrada = esquemaCrearRestaurante.parse(request.body);
  const creado = await servicio.crear(usuarioDe(request), entrada);
  return reply.code(201).send(creado);
};

export const panel = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = parametrosId.parse(request.params);
  return reply.code(200).send(await servicio.obtenerPanel(usuarioDe(request), id));
};

export const actualizar = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = parametrosId.parse(request.params);
  const entrada = esquemaActualizarRestaurante.parse(request.body);
  return reply.code(200).send(await servicio.actualizar(usuarioDe(request), id, entrada));
};

export const actualizarTema = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = parametrosId.parse(request.params);
  const entrada = esquemaTema.parse(request.body);
  return reply.code(200).send(await servicio.actualizarTema(usuarioDe(request), id, entrada));
};

export const actualizarCocinas = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = parametrosId.parse(request.params);
  const { cocinas } = esquemaCocinas.parse(request.body);
  return reply.code(200).send({
    cocinas: await servicio.reemplazarCocinas(usuarioDe(request), id, cocinas),
  });
};
