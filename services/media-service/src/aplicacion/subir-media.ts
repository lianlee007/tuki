import { randomUUID } from 'node:crypto';
import { errorProhibido, errorValidacion } from '../dominio/errores.js';
import {
  extensionDe,
  puedeSubir,
  validarArchivo,
  type ArchivoParaSubir,
  type MediaAsset,
} from '../dominio/media.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { AlmacenObjetos } from '../puertos/almacen.objetos.js';
import type { MediaRepositorio } from '../puertos/media.repositorio.js';

interface Dependencias {
  media: MediaRepositorio;
  almacen: AlmacenObjetos;
}

/**
 * Caso de uso: subir una imagen.
 *
 * Valida el rol y el archivo, guarda el objeto en el almacén y registra los
 * metadatos. La URL se construye con el puerto de almacenamiento.
 */
export const subirMedia =
  ({ media, almacen }: Dependencias) =>
  async (
    usuario: ContextoAutenticacion,
    archivo: ArchivoParaSubir,
  ): Promise<MediaAsset> => {
    if (!puedeSubir(usuario, archivo.destino)) {
      throw errorProhibido('Solo el dueño puede subir imágenes del restaurante.');
    }

    const problema = validarArchivo(archivo);
    if (problema) throw errorValidacion(problema);

    const key = `${archivo.destino}/${usuario.usuarioId}/${randomUUID()}.${extensionDe(
      archivo.contentType,
    )}`;

    await almacen.asegurarBucket();
    await almacen.subir(key, archivo.contenido, archivo.contentType);

    const registro = await media.insertar({
      usuarioId: usuario.usuarioId,
      destino: archivo.destino,
      key,
      contentType: archivo.contentType,
      bytes: archivo.bytes,
    });

    return { ...registro, url: almacen.urlPublica(registro.key) };
  };
