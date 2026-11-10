import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { CasosDeUsoRestaurantes } from '../../aplicacion/casos-uso.js';
import { errorNoAutorizado } from '../../dominio/errores.js';
import {
  esquemaCategoria,
  esquemaDisponibilidad,
  esquemaPlatillo,
} from './restaurantes.esquemas.js';

const parametrosLocal = z.object({ id: z.string().uuid() });
const parametrosCategoria = parametrosLocal.extend({ categoriaId: z.string().uuid() });
const parametrosPlatillo = parametrosLocal.extend({ platilloId: z.string().uuid() });

const usuarioDe = (request: FastifyRequest) => {
  if (!request.usuario) throw errorNoAutorizado('Inicia sesión para continuar.');
  return request.usuario;
};

/** Adaptador de entrada HTTP del CRUD del menú. */
export const crearControladorMenu = (casos: CasosDeUsoRestaurantes) => ({
  listarCategorias: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = parametrosLocal.parse(request.params);
    return reply.code(200).send({
      categorias: await casos.listarCategorias(usuarioDe(request), id),
    });
  },

  crearCategoria: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = parametrosLocal.parse(request.params);
    const entrada = esquemaCategoria.parse(request.body);
    return reply
      .code(201)
      .send(await casos.crearCategoria(usuarioDe(request), id, entrada));
  },

  actualizarCategoria: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id, categoriaId } = parametrosCategoria.parse(request.params);
    const entrada = esquemaCategoria.partial().parse(request.body);
    return reply
      .code(200)
      .send(await casos.actualizarCategoria(usuarioDe(request), id, categoriaId, entrada));
  },

  eliminarCategoria: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id, categoriaId } = parametrosCategoria.parse(request.params);
    await casos.eliminarCategoria(usuarioDe(request), id, categoriaId);
    return reply.code(204).send();
  },

  listarPlatillos: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = parametrosLocal.parse(request.params);
    return reply.code(200).send({
      platillos: await casos.listarPlatillos(usuarioDe(request), id),
    });
  },

  crearPlatillo: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = parametrosLocal.parse(request.params);
    const entrada = esquemaPlatillo.parse(request.body);
    return reply.code(201).send(await casos.crearPlatillo(usuarioDe(request), id, entrada));
  },

  actualizarPlatillo: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id, platilloId } = parametrosPlatillo.parse(request.params);
    const entrada = esquemaPlatillo.partial().parse(request.body);
    return reply
      .code(200)
      .send(await casos.actualizarPlatillo(usuarioDe(request), id, platilloId, entrada));
  },

  eliminarPlatillo: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id, platilloId } = parametrosPlatillo.parse(request.params);
    await casos.eliminarPlatillo(usuarioDe(request), id, platilloId);
    return reply.code(204).send();
  },

  disponibilidad: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id, platilloId } = parametrosPlatillo.parse(request.params);
    const { disponible } = esquemaDisponibilidad.parse(request.body);
    return reply
      .code(200)
      .send(
        await casos.cambiarDisponibilidad(
          usuarioDe(request),
          id,
          platilloId,
          disponible,
        ),
      );
  },
});
