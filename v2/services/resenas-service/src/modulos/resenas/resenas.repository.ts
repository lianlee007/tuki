import { sql } from '../../db/cliente.js';
import type { Resena } from '@tuki/dominio';
import { redondearPromedio } from '../../lib/promedio.js';
import type { EntradaResena, FilaResena, ResumenResenas } from './resenas.types.js';

const aResena = (fila: FilaResena): Resena => ({
  id: fila.id,
  restauranteId: fila.restaurante_id,
  platilloId: fila.platillo_id,
  usuarioId: fila.usuario_id,
  nombreCliente: fila.nombre_cliente,
  calificacion: fila.calificacion,
  comentario: fila.comentario,
  fotoUrl: fila.foto_url,
  respuestaDueno: fila.respuesta_dueno,
  utiles: Number(fila.utiles),
  creadoEn: fila.creado_en.toISOString(),
});

const CAMPOS = `
  r.*,
  (select count(*) from resenas_utiles u where u.resena_id = r.id) as utiles
`;

export const listarPorRestaurante = async (restauranteId: string): Promise<Resena[]> => {
  const filas = await sql<FilaResena[]>`
    select ${sql.unsafe(CAMPOS)}
    from resenas r
    where r.restaurante_id = ${restauranteId} and r.visible
    order by r.creado_en desc
    limit 200
  `;
  return filas.map(aResena);
};

export const listarPorUsuario = async (usuarioId: string): Promise<Resena[]> => {
  const filas = await sql<FilaResena[]>`
    select ${sql.unsafe(CAMPOS)}
    from resenas r
    where r.usuario_id = ${usuarioId}
    order by r.creado_en desc
    limit 100
  `;
  return filas.map(aResena);
};

export const crear = async (entrada: EntradaResena & { usuarioId: string }): Promise<Resena> => {
  const [fila] = await sql<FilaResena[]>`
    insert into resenas (
      restaurante_id, platillo_id, usuario_id, nombre_cliente,
      calificacion, comentario, foto_url
    ) values (
      ${entrada.restauranteId}, ${entrada.platilloId ?? null}, ${entrada.usuarioId},
      ${entrada.nombreCliente}, ${entrada.calificacion}, ${entrada.comentario ?? null},
      ${entrada.fotoUrl ?? null}
    )
    returning *, 0::bigint as utiles
  `;
  if (!fila) throw new Error('No se pudo crear la reseña.');
  return aResena(fila);
};

export const buscarPorId = async (id: string): Promise<Resena | null> => {
  const [fila] = await sql<FilaResena[]>`
    select ${sql.unsafe(CAMPOS)} from resenas r where r.id = ${id} limit 1
  `;
  return fila ? aResena(fila) : null;
};

export const eliminar = async (id: string): Promise<boolean> => {
  const filas = await sql`delete from resenas where id = ${id} returning id`;
  return filas.length > 0;
};

export const marcarUtil = async (resenaId: string, usuarioId: string): Promise<void> => {
  await sql`
    insert into resenas_utiles (resena_id, usuario_id)
    values (${resenaId}, ${usuarioId})
    on conflict do nothing
  `;
};

export const quitarUtil = async (resenaId: string, usuarioId: string): Promise<void> => {
  await sql`
    delete from resenas_utiles
    where resena_id = ${resenaId} and usuario_id = ${usuarioId}
  `;
};

export const responder = async (id: string, respuesta: string): Promise<Resena | null> => {
  const [fila] = await sql<FilaResena[]>`
    update resenas set respuesta_dueno = ${respuesta}, actualizado_en = now()
    where id = ${id}
    returning *, 0::bigint as utiles
  `;
  return fila ? aResena(fila) : null;
};

/** Quita la respuesta del dueño dejando la reseña intacta. */
export const borrarRespuesta = async (id: string): Promise<Resena | null> => {
  const [fila] = await sql<FilaResena[]>`
    update resenas set respuesta_dueno = null, actualizado_en = now()
    where id = ${id}
    returning *, 0::bigint as utiles
  `;
  return fila ? aResena(fila) : null;
};

export const cambiarVisible = async (id: string, visible: boolean): Promise<Resena | null> => {
  const [fila] = await sql<FilaResena[]>`
    update resenas set visible = ${visible}, actualizado_en = now()
    where id = ${id}
    returning *, 0::bigint as utiles
  `;
  return fila ? aResena(fila) : null;
};

export const resumen = async (restauranteId: string): Promise<ResumenResenas> => {
  const [fila] = await sql<{ promedio: string; cantidad: string }[]>`
    select coalesce(avg(calificacion), 0)::text as promedio, count(*)::text as cantidad
    from resenas
    where restaurante_id = ${restauranteId} and visible
  `;
  return {
    promedio: redondearPromedio(Number(fila?.promedio ?? 0)),
    cantidad: Number(fila?.cantidad ?? 0),
  };
};
