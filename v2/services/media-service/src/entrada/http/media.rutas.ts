import type { FastifyInstance } from 'fastify';
import type { CasosDeUsoMedia } from '../../aplicacion/casos-uso.js';
import { crearControlador } from './media.controlador.js';

/** Rutas de medios; siempre requieren sesión. */
export const registrarRutasMedia = async (
  app: FastifyInstance,
  servicios: CasosDeUsoMedia,
): Promise<void> => {
  const controlador = crearControlador(servicios);

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
