import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { CasosDeUsoAdmin } from '../../aplicacion/casos-uso.js';
import { errorNoAutorizado } from '../../dominio/errores.js';
import { esquemaEstado, esquemaListado, esquemaRol } from './admin.esquemas.js';

const parametros = z.object({ id: z.string().uuid() });

const usuarioDe = (request: FastifyRequest) => {
  if (!request.usuario) throw errorNoAutorizado('Inicia sesión para continuar.');
  return request.usuario;
};

const tokenDe = (request: FastifyRequest): string => {
  const encabezado = request.headers.authorization ?? '';
  return encabezado.startsWith('Bearer ') ? encabezado.slice(7).trim() : '';
};

/** Adaptador de entrada HTTP del BFF de administración. */
export const crearControlador = (servicios: CasosDeUsoAdmin) => ({
  panorama: async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send(await servicios.panorama(tokenDe(request)));
  },

  restaurantes: async (request: FastifyRequest, reply: FastifyReply) => {
    const filtros = esquemaListado.parse(request.query);
    const resultado = await servicios.restaurantes(tokenDe(request), filtros);
    return reply.code(200).send({
      ...resultado,
      desde: filtros.desde,
      limite: filtros.limite,
    });
  },

  cambiarEstado: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = parametros.parse(request.params);
    const { activo } = esquemaEstado.parse(request.body);
    return reply
      .code(200)
      .send(
        await servicios.cambiarEstado(
          usuarioDe(request),
          tokenDe(request),
          id,
          activo,
        ),
      );
  },

  usuarios: async (request: FastifyRequest, reply: FastifyReply) => {
    const filtros = esquemaListado.parse(request.query);
    const resultado = await servicios.usuarios(tokenDe(request), filtros);
    return reply.code(200).send({
      ...resultado,
      desde: filtros.desde,
      limite: filtros.limite,
    });
  },

  cambiarRol: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = parametros.parse(request.params);
    const { rol } = esquemaRol.parse(request.body);
    return reply
      .code(200)
      .send(
        await servicios.cambiarRol(
          usuarioDe(request),
          tokenDe(request),
          id,
          rol,
        ),
      );
  },

  auditoria: async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send({ items: await servicios.auditoria() });
  },
});
