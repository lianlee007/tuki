import { errorNoEncontrado } from '../dominio/errores.js';
import type { Resena } from '../dominio/resena.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { ResenasRepositorio } from '../puertos/resenas.repositorio.js';

interface Dependencias {
  resenas: ResenasRepositorio;
}

/** Caso de uso: marcar una reseña como útil. */
export const marcarResenaUtil =
  ({ resenas }: Dependencias) =>
  async (usuario: ContextoAutenticacion, id: string): Promise<Resena | null> => {
    const resena = await resenas.buscarPorId(id);
    if (!resena) throw errorNoEncontrado('No encontramos la reseña.');
    await resenas.marcarUtil(id, usuario.usuarioId);
    return resenas.buscarPorId(id);
  };

/** Caso de uso: retirar el voto de utilidad. */
export const quitarResenaUtil =
  ({ resenas }: Dependencias) =>
  async (usuario: ContextoAutenticacion, id: string): Promise<Resena | null> => {
    await resenas.quitarUtil(id, usuario.usuarioId);
    return resenas.buscarPorId(id);
  };
