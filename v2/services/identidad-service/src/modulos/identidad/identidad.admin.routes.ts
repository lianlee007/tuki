import type { FastifyInstance } from 'fastify';
import { exigirRol } from '../../plugins/autenticacion.js';
import * as controlador from './identidad.admin.controller.js';

/** Rutas exclusivas del superadministrador. */
export const registrarRutasAdminIdentidad = async (app: FastifyInstance): Promise<void> => {
  const soloAdmin = { preHandler: [app.autenticar, exigirRol('superadmin')] };

  app.get('/v1/admin/usuarios', soloAdmin, controlador.listar);
  app.get('/v1/admin/usuarios/resumen', soloAdmin, controlador.resumen);
  app.patch('/v1/admin/usuarios/:id/rol', soloAdmin, controlador.cambiarRol);
};
