import type { FastifyInstance } from 'fastify';
import * as controlador from './publico.controller.js';

/** Rutas de lectura pública; no requieren sesión. */
export const registrarRutasPublicas = async (app: FastifyInstance): Promise<void> => {
  app.get('/v1/restaurantes/cocinas', controlador.cocinas);
  app.get('/v1/restaurantes/platos', controlador.buscarPlatos);
  app.get('/v1/restaurantes/:id/platos-publicos', controlador.menuPublico);
  app.get('/v1/restaurantes', controlador.listar);
  app.get('/v1/restaurantes/:slug', controlador.ficha);
};
