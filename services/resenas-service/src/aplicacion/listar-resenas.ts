import type { Resena, ResumenResenas } from '../dominio/resena.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { ResenasRepositorio } from '../puertos/resenas.repositorio.js';

interface Dependencias {
  resenas: ResenasRepositorio;
}

export interface ListadoResenas {
  resenas: Resena[];
  resumen: ResumenResenas;
}

/** Caso de uso: ficha pública de reseñas de un restaurante. */
export const listarResenas =
  ({ resenas }: Dependencias) =>
  async (restauranteId: string): Promise<ListadoResenas> => {
    const [lista, resumen] = await Promise.all([
      resenas.listarPorRestaurante(restauranteId),
      resenas.resumen(restauranteId),
    ]);
    return { resenas: lista, resumen };
  };

/** Caso de uso: reseñas escritas por el usuario autenticado. */
export const listarMisResenas =
  ({ resenas }: Dependencias) =>
  (usuario: ContextoAutenticacion): Promise<Resena[]> =>
    resenas.listarPorUsuario(usuario.usuarioId);
