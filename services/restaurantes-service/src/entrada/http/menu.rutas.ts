import type { FastifyInstance } from 'fastify';
import type { CasosDeUsoRestaurantes } from '../../aplicacion/casos-uso.js';
import { exigirRol } from '../../plugins/autenticacion.js';
import { crearControladorMenu } from './menu.controlador.js';

/** CRUD del menú; solo el dueño del local o el superadmin. */
export const registrarRutasMenu = async (
  app: FastifyInstance,
  casos: CasosDeUsoRestaurantes,
): Promise<void> => {
  const controlador = crearControladorMenu(casos);
  const soloDueno = { preHandler: [app.autenticar, exigirRol('dueno', 'superadmin')] };

  app.get('/v1/restaurantes/:id/categorias', soloDueno, controlador.listarCategorias);
  app.post('/v1/restaurantes/:id/categorias', soloDueno, controlador.crearCategoria);
  app.put(
    '/v1/restaurantes/:id/categorias/:categoriaId',
    soloDueno,
    controlador.actualizarCategoria,
  );
  app.delete(
    '/v1/restaurantes/:id/categorias/:categoriaId',
    soloDueno,
    controlador.eliminarCategoria,
  );

  app.get('/v1/restaurantes/:id/platillos', soloDueno, controlador.listarPlatillos);
  app.post('/v1/restaurantes/:id/platillos', soloDueno, controlador.crearPlatillo);
  app.put(
    '/v1/restaurantes/:id/platillos/:platilloId',
    soloDueno,
    controlador.actualizarPlatillo,
  );
  app.delete(
    '/v1/restaurantes/:id/platillos/:platilloId',
    soloDueno,
    controlador.eliminarPlatillo,
  );
  app.patch(
    '/v1/restaurantes/:id/platillos/:platilloId/disponibilidad',
    soloDueno,
    controlador.disponibilidad,
  );
};
