import type { MediaAsset } from '../dominio/media.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { AlmacenObjetos } from '../puertos/almacen.objetos.js';
import type { MediaRepositorio } from '../puertos/media.repositorio.js';

interface Dependencias {
  media: MediaRepositorio;
  almacen: AlmacenObjetos;
}

/** Caso de uso: archivos subidos por la cuenta autenticada. */
export const listarMisMedia =
  ({ media, almacen }: Dependencias) =>
  async (usuario: ContextoAutenticacion): Promise<MediaAsset[]> => {
    const registros = await media.listarPorUsuario(usuario.usuarioId);
    return registros.map((registro) => ({
      ...registro,
      url: almacen.urlPublica(registro.key),
    }));
  };
