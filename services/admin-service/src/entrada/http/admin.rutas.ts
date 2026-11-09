import type { FastifyInstance } from 'fastify';
import type { CasosDeUsoAdmin } from '../../aplicacion/casos-uso.js';
import { exigirRol } from '../../plugins/autenticacion.js';
import { crearControlador } from './admin.controlador.js';

/** Todo el BFF exige superadmin. */
export const registrarRutasAdmin = async (
  app: FastifyInstance,
  servicios: CasosDeUsoAdmin,
): Promise<void> => {
  const controlador = crearControlador(servicios);
  const soloAdmin = { preHandler: [app.autenticar, exigirRol('superadmin')] };

  app.get('/v1/admin/panorama', soloAdmin, controlador.panorama);
  app.get('/v1/admin/restaurantes', soloAdmin, controlador.restaurantes);
  app.patch(
    '/v1/admin/restaurantes/:id/estado',
    soloAdmin,
    controlador.cambiarEstado,
  );
  app.get('/v1/admin/usuarios', soloAdmin, controlador.usuarios);
  app.patch('/v1/admin/usuarios/:id/rol', soloAdmin, controlador.cambiarRol);
  app.get('/v1/admin/auditoria', soloAdmin, controlador.auditoria);
};
