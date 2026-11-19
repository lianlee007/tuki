import { randomUUID } from 'node:crypto';
import {
  errorImagenNoComida,
  errorProhibido,
  errorValidacion,
} from '../dominio/errores.js';
import {
  extensionDe,
  puedeSubir,
  validarArchivo,
  type ArchivoParaSubir,
  type MediaAsset,
} from '../dominio/media.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { AlmacenObjetos } from '../puertos/almacen.objetos.js';
import type { ClasificadorImagenes } from '../puertos/clasificador.imagenes.js';
import type { MediaRepositorio } from '../puertos/media.repositorio.js';

interface Dependencias {
  media: MediaRepositorio;
  almacen: AlmacenObjetos;
  clasificador?: ClasificadorImagenes;
}

/**
 * Caso de uso: subir una imagen.
 *
 * Valida el rol y el archivo, revisa que las fotos de platos sean comida,
 * guarda el objeto en el almacén y registra los metadatos. La URL se construye
 * con el puerto de almacenamiento.
 *
 * El revisor de fotos falla abierto: si el servicio de visión no responde, la
 * subida continúa. Solo se bloquea cuando la respuesta es un "no es comida"
 * con confianza suficiente, que el servicio ya resolvió con su umbral.
 */
export const subirMedia =
  ({ media, almacen, clasificador }: Dependencias) =>
  async (
    usuario: ContextoAutenticacion,
    archivo: ArchivoParaSubir,
  ): Promise<MediaAsset> => {
    if (!puedeSubir(usuario, archivo.destino)) {
      throw errorProhibido('Solo el dueño puede subir imágenes del restaurante.');
    }

    const problema = validarArchivo(archivo);
    if (problema) throw errorValidacion(problema);

    if (archivo.destino === 'platillos' && clasificador) {
      const esComida = await clasificador.esComida(
        archivo.contenido,
        archivo.contentType,
      );
      if (esComida === false) {
        throw errorImagenNoComida(
          'Esa foto no parece un plato de comida. Sube una foto del platillo.',
        );
      }
    }

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
