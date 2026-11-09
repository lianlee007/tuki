import type { FastifyInstance } from 'fastify';
import type { CasosDeUsoPedidos } from '../../aplicacion/casos-uso.js';
import { exigirRol } from '../../plugins/autenticacion.js';
import { crearControlador } from './pedidos.controlador.js';

/** Rutas de pedidos; todas requieren sesión. */
export const registrarRutasPedidos = async (
  app: FastifyInstance,
  servicios: CasosDeUsoPedidos,
): Promise<void> => {
  const controlador = crearControlador(servicios);
  const sesion = { preHandler: [app.autenticar] };
  const soloDueno = { preHandler: [app.autenticar, exigirRol('dueno', 'superadmin')] };

  app.post('/v1/pedidos', sesion, controlador.crear);
  app.get('/v1/pedidos/mios', sesion, controlador.mios);
  app.get('/v1/pedidos/restaurante/:restauranteId', soloDueno, controlador.porRestaurante);
  app.get('/v1/pedidos/:id', sesion, controlador.obtener);
  app.patch('/v1/pedidos/:id/estado', soloDueno, controlador.cambiarEstado);
  app.get(
    '/v1/admin/pedidos/resumen',
    { preHandler: [app.autenticar, exigirRol('superadmin')] },
    controlador.resumenAdmin,
  );
};
