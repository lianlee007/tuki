import type { FastifyInstance } from 'fastify';
import { exigirRol } from '../../plugins/autenticacion.js';
import * as controlador from './admin.controller.js';

/** Rutas de administración de restaurantes. */
export const registrarRutasAdminRestaurantes = async (
  app: FastifyInstance,
): Promise<void> => {
  const soloAdmin = { preHandler: [app.autenticar, exigirRol('superadmin')] };

  app.get('/v1/admin/restaurantes', soloAdmin, controlador.listar);
  app.get('/v1/admin/restaurantes/resumen', soloAdmin, controlador.resumen);
  app.patch('/v1/admin/restaurantes/:id/estado', soloAdmin, controlador.cambiarEstado);
};
