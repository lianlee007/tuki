import type { FastifyInstance } from 'fastify';
import * as controlador from './media.controller.js';

/** Rutas de medios; siempre requieren sesión. */
export const registrarRutasMedia = async (app: FastifyInstance): Promise<void> => {
  app.post(
    '/v1/media/subir',
    {
      preHandler: [app.autenticar],
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    controlador.subir,
  );

  app.get(
    '/v1/media/mios',
    { preHandler: [app.autenticar] },
    controlador.listarMios,
  );
};
