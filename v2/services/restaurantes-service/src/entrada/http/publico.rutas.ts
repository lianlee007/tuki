import type { FastifyInstance } from 'fastify';
import type { CasosDeUsoRestaurantes } from '../../aplicacion/casos-uso.js';
import { crearControladorPublico } from './publico.controlador.js';

/** Rutas de lectura pública; no requieren sesión. */
export const registrarRutasPublicas = async (
  app: FastifyInstance,
  casos: CasosDeUsoRestaurantes,
): Promise<void> => {
  const controlador = crearControladorPublico(casos);

  app.get('/v1/restaurantes/cocinas', controlador.cocinas);
  app.get('/v1/restaurantes/platos', controlador.buscarPlatos);
  app.get('/v1/restaurantes/:id/platos-publicos', controlador.menuPublico);
  app.get('/v1/restaurantes', controlador.listar);
  app.get('/v1/restaurantes/:slug', controlador.ficha);
};
