import { errorNoEncontrado, errorProhibido } from '../dominio/errores.js';
import { puedeOcultar, type Resena } from '../dominio/resena.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { ResenasRepositorio } from '../puertos/resenas.repositorio.js';

interface Dependencias {
  resenas: ResenasRepositorio;
}

/** Caso de uso: el superadmin oculta o vuelve a mostrar una reseña. */
export const cambiarVisibilidadResena =
  ({ resenas }: Dependencias) =>
  async (
    usuario: ContextoAutenticacion,
    id: string,
    visible: boolean,
  ): Promise<Resena> => {
    if (!puedeOcultar(usuario)) {
      throw errorProhibido('Solo el superadmin puede ocultar una reseña.');
    }
    const resena = await resenas.cambiarVisible(id, visible);
    if (!resena) throw errorNoEncontrado('No encontramos la reseña.');
    return resena;
  };
