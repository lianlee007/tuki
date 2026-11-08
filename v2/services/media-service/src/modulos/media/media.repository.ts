import { sql } from '../../db/cliente.js';
import { urlPublica } from '../../lib/s3.js';
import type { FilaMedia, MediaAsset } from './media.types.js';

const aMedia = (fila: FilaMedia): MediaAsset => ({
  id: fila.id,
  usuarioId: fila.usuario_id,
  destino: fila.destino,
  key: fila.key,
  url: urlPublica(fila.key),
  contentType: fila.content_type,
  bytes: Number(fila.bytes),
  creadoEn: fila.creado_en.toISOString(),
});

export const insertar = async (entrada: {
  usuarioId: string;
  destino: string;
  key: string;
  contentType: string;
  bytes: number;
}): Promise<MediaAsset> => {
  const [fila] = await sql<FilaMedia[]>`
    insert into media_assets (usuario_id, destino, key, content_type, bytes)
    values (${entrada.usuarioId}, ${entrada.destino}, ${entrada.key},
            ${entrada.contentType}, ${entrada.bytes})
    returning *
  `;
  if (!fila) throw new Error('No se pudo registrar el archivo.');
  return aMedia(fila);
};

export const listarPorUsuario = async (usuarioId: string): Promise<MediaAsset[]> => {
  const filas = await sql<FilaMedia[]>`
    select * from media_assets
    where usuario_id = ${usuarioId}
    order by creado_en desc
    limit 100
  `;
  return filas.map(aMedia);
};
