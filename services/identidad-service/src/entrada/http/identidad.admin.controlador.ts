import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { CasosDeUsoIdentidad } from '../../aplicacion/casos-uso.js';
import { esquemaListadoUsuarios, esquemaRol } from './identidad.esquemas.js';

const parametros = z.object({ id: z.string().uuid() });

/** Adaptador de entrada HTTP del panel de administración. */
export const crearControladorAdmin = (casos: CasosDeUsoIdentidad) => ({
  listar: async (request: FastifyRequest, reply: FastifyReply) => {
    const filtros = esquemaListadoUsuarios.parse(request.query);
    const { items, total } = await casos.listarUsuarios(filtros);
    return reply.code(200).send({
      items,
      total,
      desde: filtros.desde,
      limite: filtros.limite,
    });
  },

  resumen: async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send(await casos.resumenUsuarios());
  },

  cambiarRol: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = parametros.parse(request.params);
    const { rol } = esquemaRol.parse(request.body);
    return reply.code(200).send({ usuario: await casos.cambiarRol(id, rol) });
  },
});
