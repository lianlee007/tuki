import { errorProhibido } from './errores.js';
import type { ContextoAutenticacion } from './usuario.js';

/** Solo dueños y superadmin pueden administrar un restaurante. */
export const exigirDueno = (usuario: ContextoAutenticacion): void => {
  if (usuario.rol !== 'dueno' && usuario.rol !== 'superadmin') {
    throw errorProhibido('Solo el dueño del restaurante puede hacer esta acción.');
  }
};

/** El recurso debe pertenecer al dueño autenticado; el superadmin puede todo. */
export const exigirPropietario = (
  usuario: ContextoAutenticacion,
  duenoId: string,
): void => {
  if (usuario.rol !== 'superadmin' && duenoId !== usuario.usuarioId) {
    throw errorProhibido('Ese restaurante no pertenece a tu cuenta.');
  }
};
