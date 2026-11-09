import type { FastifyInstance } from 'fastify';
import type { CasosDeUsoIdentidad } from '../../aplicacion/casos-uso.js';
import { exigirRol } from '../../plugins/autenticacion.js';
import { crearControladorAdmin } from './identidad.admin.controlador.js';

/** Rutas exclusivas del superadministrador. */
export const registrarRutasAdminIdentidad = async (
  app: FastifyInstance,
  casos: CasosDeUsoIdentidad,
): Promise<void> => {
  const controlador = crearControladorAdmin(casos);
  const soloAdmin = { preHandler: [app.autenticar, exigirRol('superadmin')] };

  app.get('/v1/admin/usuarios', soloAdmin, controlador.listar);
  app.get('/v1/admin/usuarios/resumen', soloAdmin, controlador.resumen);
  app.patch('/v1/admin/usuarios/:id/rol', soloAdmin, controlador.cambiarRol);
};
