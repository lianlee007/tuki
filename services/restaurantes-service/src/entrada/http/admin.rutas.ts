import type { FastifyInstance } from 'fastify';
import type { CasosDeUsoRestaurantes } from '../../aplicacion/casos-uso.js';
import { exigirRol } from '../../plugins/autenticacion.js';
import { crearControladorAdmin } from './admin.controlador.js';

/** Rutas de administración de restaurantes. */
export const registrarRutasAdminRestaurantes = async (
  app: FastifyInstance,
  casos: CasosDeUsoRestaurantes,
): Promise<void> => {
  const controlador = crearControladorAdmin(casos);
  const soloAdmin = { preHandler: [app.autenticar, exigirRol('superadmin')] };

  app.get('/v1/admin/restaurantes', soloAdmin, controlador.listar);
  app.get('/v1/admin/restaurantes/resumen', soloAdmin, controlador.resumen);
  app.patch('/v1/admin/restaurantes/:id/estado', soloAdmin, controlador.cambiarEstado);
};
