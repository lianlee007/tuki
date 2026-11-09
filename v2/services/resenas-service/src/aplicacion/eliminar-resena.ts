import { errorNoEncontrado, errorProhibido } from '../dominio/errores.js';
import { puedeEliminar } from '../dominio/resena.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { ResenasRepositorio } from '../puertos/resenas.repositorio.js';

interface Dependencias {
  resenas: ResenasRepositorio;
}

/** Caso de uso: borrar una reseña propia o moderar como superadmin. */
export const eliminarResena =
  ({ resenas }: Dependencias) =>
  async (usuario: ContextoAutenticacion, id: string): Promise<void> => {
    const resena = await resenas.buscarPorId(id);
    if (!resena) throw errorNoEncontrado('No encontramos la reseña.');
    if (!puedeEliminar(usuario, resena)) {
      throw errorProhibido('Solo puedes eliminar tus propias reseñas.');
    }
    await resenas.eliminar(id);
  };
