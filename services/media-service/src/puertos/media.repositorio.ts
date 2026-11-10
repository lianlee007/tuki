import type { Destino, MediaRegistro } from '../dominio/media.js';

export interface EntradaMediaRepositorio {
  usuarioId: string;
  destino: Destino;
  key: string;
  contentType: string;
  bytes: number;
}

/** Puerto de persistencia de metadatos. No conoce S3 ni URLs públicas. */
export interface MediaRepositorio {
  insertar(entrada: EntradaMediaRepositorio): Promise<MediaRegistro>;
  listarPorUsuario(usuarioId: string): Promise<MediaRegistro[]>;
}
