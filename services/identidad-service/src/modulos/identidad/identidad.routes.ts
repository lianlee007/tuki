import type { FastifyInstance } from 'fastify';
import * as controlador from './identidad.controller.js';

/**
 * Rutas públicas y protegidas de identidad.
 *
 * El prefijo `/v1/identidad` permite que el gateway enrute por servicio sin
 * reescribir rutas y deja espacio para versionar el contrato.
 */
export const registrarRutasIdentidad = async (app: FastifyInstance): Promise<void> => {
  app.post(
    '/v1/identidad/registro',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    controlador.registrar,
  );

  app.post(
    '/v1/identidad/login',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    controlador.iniciarSesion,
  );

  app.post(
    '/v1/identidad/refresh',
    {
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    controlador.refrescar,
  );

  app.post('/v1/identidad/logout', controlador.cerrarSesion);

  app.get(
    '/v1/identidad/perfil',
    { preHandler: app.autenticar },
    controlador.perfil,
  );
};
