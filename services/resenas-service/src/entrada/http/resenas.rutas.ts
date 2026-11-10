import type { FastifyInstance } from 'fastify';
import type { CasosDeUsoResenas } from '../../aplicacion/casos-uso.js';
import { exigirRol } from '../../plugins/autenticacion.js';
import { crearControlador } from './resenas.controlador.js';

/** Rutas de reseñas: lectura pública y escritura autenticada. */
export const registrarRutasResenas = async (
  app: FastifyInstance,
  servicios: CasosDeUsoResenas,
): Promise<void> => {
  const controlador = crearControlador(servicios);
  const sesion = { preHandler: [app.autenticar] };
  const dueno = { preHandler: [app.autenticar, exigirRol('dueno', 'superadmin')] };
  const admin = { preHandler: [app.autenticar, exigirRol('superadmin')] };

  app.get('/v1/resenas/restaurante/:restauranteId', controlador.listar);
  app.get('/v1/resenas/mios', sesion, controlador.mias);
  app.post('/v1/resenas', sesion, controlador.crear);
  app.delete('/v1/resenas/:id', sesion, controlador.eliminar);
  app.post('/v1/resenas/:id/util', sesion, controlador.marcarUtil);
  app.delete('/v1/resenas/:id/util', sesion, controlador.quitarUtil);
  app.put('/v1/resenas/:id/respuesta', dueno, controlador.responder);
  app.delete('/v1/resenas/:id/respuesta', dueno, controlador.borrarRespuesta);
  app.patch('/v1/resenas/:id/visible', admin, controlador.cambiarVisible);
};
