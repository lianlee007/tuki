import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import type { FastifyInstance } from 'fastify';
import { ErrorDominio, type CodigoError } from '../dominio/errores.js';

const ESTADOS: Record<CodigoError, number> = {
  no_encontrado: 404,
  conflicto: 409,
  no_autorizado: 401,
  prohibido: 403,
  validacion: 400,
  servicio_no_disponible: 503,
};

/**
 * Formato único de error.
 *
 * El frontend solo necesita `codigo` para decidir qué mostrar y `mensaje` para
 * la persona. Los detalles de validación se envían sin exponer la traza.
 */
export default fp(async (app: FastifyInstance) => {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ErrorDominio) {
      return reply.code(ESTADOS[error.codigo]).send({
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

    const errorConEstado = error as { statusCode?: number; message?: string };
    if (errorConEstado.statusCode && errorConEstado.statusCode < 500) {
      return reply.code(errorConEstado.statusCode).send({
        error: {
          codigo: 'solicitud_invalida',
          mensaje: errorConEstado.message ?? 'La solicitud no es válida.',
        },
      });
    }

    request.log.error({ err: error }, 'Error no controlado');
    return reply.code(500).send({
      error: {
        codigo: 'error_interno',
        mensaje: 'Ocurrió un error inesperado.',
      },
    });
  });

  app.setNotFoundHandler((_request, reply) =>
    reply.code(404).send({
      error: {
        codigo: 'ruta_no_encontrada',
        mensaje: 'La ruta solicitada no existe.',
      },
    }),
  );
});
