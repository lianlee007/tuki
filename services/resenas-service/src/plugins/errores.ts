import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import type { FastifyInstance } from 'fastify';
import { ErrorHttp } from '../lib/errores.js';

/** Formato único de error del servicio. */
export default fp(async (app: FastifyInstance) => {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ErrorHttp) {
      return reply.code(error.estado).send({
        error: {
          codigo: error.codigo,
          mensaje: error.message,
          ...(error.detalles === undefined ? {} : { detalles: error.detalles }),
        },
      });
    }

    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: {
          codigo: 'validacion',
          mensaje: 'Revisa los datos enviados.',
          detalles: error.issues.map((issue) => ({
            campo: issue.path.join('.'),
            mensaje: issue.message,
          })),
        },
      });
    }

    const conEstado = error as { statusCode?: number; message?: string };
    if (conEstado.statusCode && conEstado.statusCode < 500) {
      return reply.code(conEstado.statusCode).send({
        error: {
          codigo: 'solicitud_invalida',
          mensaje: conEstado.message ?? 'La solicitud no es válida.',
        },
      });
    }

    request.log.error({ err: error }, 'Error no controlado');
    return reply.code(500).send({
      error: { codigo: 'error_interno', mensaje: 'Ocurrió un error inesperado.' },
    });
  });

  app.setNotFoundHandler((_request, reply) =>
    reply.code(404).send({
      error: { codigo: 'ruta_no_encontrada', mensaje: 'La ruta solicitada no existe.' },
    }),
  );
});
