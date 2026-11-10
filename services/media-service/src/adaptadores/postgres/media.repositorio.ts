import type { Destino, MediaRegistro } from '../../dominio/media.js';
import type {
  EntradaMediaRepositorio,
  MediaRepositorio,
} from '../../puertos/media.repositorio.js';
import { sql } from './cliente.js';
import type { FilaMedia } from './media.tipos.js';

const aRegistro = (fila: FilaMedia): MediaRegistro => ({
  id: fila.id,
  usuarioId: fila.usuario_id,
  destino: fila.destino as Destino,
  key: fila.key,
  contentType: fila.content_type,
  bytes: Number(fila.bytes),
  creadoEn: fila.creado_en.toISOString(),
});

const insertar = async (entrada: EntradaMediaRepositorio): Promise<MediaRegistro> => {
  const [fila] = await sql<FilaMedia[]>`
    insert into media_assets (usuario_id, destino, key, content_type, bytes)
    values (${entrada.usuarioId}, ${entrada.destino}, ${entrada.key},
            ${entrada.contentType}, ${entrada.bytes})
    returning *
  `;
  if (!fila) throw new Error('No se pudo registrar el archivo.');
  return aRegistro(fila);
};

const listarPorUsuario = async (usuarioId: string): Promise<MediaRegistro[]> => {
  const filas = await sql<FilaMedia[]>`
    select * from media_assets
    where usuario_id = ${usuarioId}
    order by creado_en desc
    limit 100
  `;
  return filas.map(aRegistro);
};

/** Adaptador PostgreSQL del puerto `MediaRepositorio`. */
export const crearRepositorioMedia = (): MediaRepositorio => ({
  insertar,
  listarPorUsuario,
});
