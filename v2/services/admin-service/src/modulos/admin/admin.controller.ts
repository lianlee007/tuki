import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { errorNoAutorizado } from '../../lib/errores.js';
import { esquemaEstado, esquemaListado, esquemaRol } from './admin.schema.js';
import * as servicio from './admin.service.js';

const parametros = z.object({ id: z.string().uuid() });
const parametrosUsuario = z.object({ id: z.string().uuid() });

const usuarioDe = (request: FastifyRequest) => {
  if (!request.usuario) throw errorNoAutorizado('Inicia sesión para continuar.');
  return request.usuario;
};

const tokenDe = (request: FastifyRequest): string => {
  const encabezado = request.headers.authorization ?? '';
  return encabezado.startsWith('Bearer ') ? encabezado.slice(7).trim() : '';
};

export const panorama = async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.code(200).send(await servicio.panorama(tokenDe(request)));
};

export const restaurantes = async (request: FastifyRequest, reply: FastifyReply) => {
  const filtros = esquemaListado.parse(request.query);
  const resultado = await servicio.restaurantes(tokenDe(request), filtros);
  return reply.code(200).send({
    ...resultado,
    desde: filtros.desde,
    limite: filtros.limite,
  });
};

export const cambiarEstado = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = parametros.parse(request.params);
  const { activo } = esquemaEstado.parse(request.body);
  return reply
    .code(200)
    .send(
      await servicio.cambiarEstado(
        usuarioDe(request),
        tokenDe(request),
        id,
        activo,
      ),
    );
};

export const usuarios = async (request: FastifyRequest, reply: FastifyReply) => {
  const filtros = esquemaListado.parse(request.query);
  const resultado = await servicio.usuarios(tokenDe(request), filtros);
  return reply.code(200).send({
    ...resultado,
    desde: filtros.desde,
    limite: filtros.limite,
  });
};

export const cambiarRol = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = parametrosUsuario.parse(request.params);
  const { rol } = esquemaRol.parse(request.body);
  return reply
    .code(200)
    .send(
      await servicio.cambiarRol(
        usuarioDe(request),
        tokenDe(request),
        id,
        rol,
      ),
    );
};

export const auditoria = async (_request: FastifyRequest, reply: FastifyReply) => {
  return reply.code(200).send({ items: await servicio.auditoria() });
};
