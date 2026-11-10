import type { Auditoria, EntradaAuditoria } from '../../dominio/admin.js';
import type { AuditoriaRepositorio } from '../../puertos/auditoria.repositorio.js';
import { sql } from './cliente.js';
import type { FilaAuditoria } from './auditoria.tipos.js';

const aAuditoria = (fila: FilaAuditoria): Auditoria => ({
  id: fila.id,
  actorId: fila.actor_id,
  accion: fila.accion,
  entidad: fila.entidad,
  entidadId: fila.entidad_id,
  detalle: fila.detalle,
  creadoEn: fila.creado_en.toISOString(),
});

const registrar = async (entrada: EntradaAuditoria): Promise<void> => {
  await sql`
    insert into auditoria_admin (actor_id, accion, entidad, entidad_id, detalle)
    values (${entrada.actorId}, ${entrada.accion}, ${entrada.entidad},
            ${entrada.entidadId ?? null}, ${JSON.stringify(entrada.detalle ?? {})})
  `;
};

const listar = async (limite = 100): Promise<Auditoria[]> => {
  const filas = await sql<FilaAuditoria[]>`
    select * from auditoria_admin order by creado_en desc limit ${limite}
  `;
  return filas.map(aAuditoria);
};

/** Adaptador PostgreSQL del puerto `AuditoriaRepositorio`. */
export const crearRepositorioAuditoria = (): AuditoriaRepositorio => ({
  registrar,
  listar,
});
