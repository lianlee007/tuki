import { listarMisMedia } from './listar-mis-media.js';
import { subirMedia } from './subir-media.js';
import type { AlmacenObjetos } from '../puertos/almacen.objetos.js';
import type { MediaRepositorio } from '../puertos/media.repositorio.js';

interface Dependencias {
  media: MediaRepositorio;
  almacen: AlmacenObjetos;
}

/** Contrato que consume la capa HTTP. */
export interface CasosDeUsoMedia {
  subir: ReturnType<typeof subirMedia>;
  listarMios: ReturnType<typeof listarMisMedia>;
}

/** Raíz de composición: casos de uso + adaptadores concretos. */
export const crearCasosDeUsoMedia = (
  dependencias: Dependencias,
): CasosDeUsoMedia => ({
  subir: subirMedia(dependencias),
  listarMios: listarMisMedia(dependencias),
});
