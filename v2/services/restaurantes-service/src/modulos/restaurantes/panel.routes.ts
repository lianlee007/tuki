import type { FastifyInstance } from 'fastify';
import { exigirRol } from '../../plugins/autenticacion.js';
import * as controlador from './panel.controller.js';

/** Rutas del dueño; todas exigen sesión y rol `dueno` o `superadmin`. */
export const registrarRutasPanel = async (app: FastifyInstance): Promise<void> => {
  const soloDueno = { preHandler: [app.autenticar, exigirRol('dueno', 'superadmin')] };

  app.get('/v1/restaurantes/mios', soloDueno, controlador.miRestaurante);
  app.post('/v1/restaurantes', soloDueno, controlador.crear);
  app.get('/v1/restaurantes/:id/panel', soloDueno, controlador.panel);
  app.put('/v1/restaurantes/:id', soloDueno, controlador.actualizar);
  app.put('/v1/restaurantes/:id/tema', soloDueno, controlador.actualizarTema);
  app.put('/v1/restaurantes/:id/cocinas', soloDueno, controlador.actualizarCocinas);
};
