import { randomUUID } from 'node:crypto';
import { errorProhibido, errorValidacion } from '../../lib/errores.js';
import { asegurarBucket, subirObjeto } from '../../lib/s3.js';
import { extensionDe, validarArchivo } from '../../lib/validar-archivo.js';
import * as repo from './media.repository.js';
import type { ArchivoParaSubir, ContextoAutenticacion } from './media.types.js';

/**
 * Sube una imagen y registra sus metadatos.
 *
 * Las fotos de menú y de local son del dueño; las de reseña las puede subir
 * cualquier persona autenticada.
 */
export const subir = async (
  usuario: ContextoAutenticacion,
  archivo: ArchivoParaSubir,
) => {
  if (archivo.destino !== 'resenas' && usuario.rol === 'cliente') {
    throw errorProhibido('Solo el dueño puede subir imágenes del restaurante.');
  }

  const problema = validarArchivo(archivo);
  if (problema) throw errorValidacion(problema);

  const key = `${archivo.destino}/${usuario.usuarioId}/${randomUUID()}.${extensionDe(
    archivo.contentType,
  )}`;

  await asegurarBucket();
  await subirObjeto(key, archivo.contenido, archivo.contentType);

  return repo.insertar({
    usuarioId: usuario.usuarioId,
    destino: archivo.destino,
    key,
    contentType: archivo.contentType,
    bytes: archivo.bytes,
  });
};

export const listarMios = (usuario: ContextoAutenticacion) =>
  repo.listarPorUsuario(usuario.usuarioId);
