import { sql } from '../../db/cliente.js';
import type { Auditoria } from './admin.types.js';

interface FilaAuditoria {
  id: string;
  actor_id: string;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalle: Record<string, unknown>;
  creado_en: Date;
}

const aAuditoria = (fila: FilaAuditoria): Auditoria => ({
  id: fila.id,
  actorId: fila.actor_id,
  accion: fila.accion,
  entidad: fila.entidad,
  entidadId: fila.entidad_id,
  detalle: fila.detalle,
  creadoEn: fila.creado_en.toISOString(),
});

export const registrar = async (entrada: {
  actorId: string;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  detalle?: Record<string, unknown>;
}): Promise<void> => {
  await sql`
    insert into auditoria_admin (actor_id, accion, entidad, entidad_id, detalle)
    values (${entrada.actorId}, ${entrada.accion}, ${entrada.entidad},
            ${entrada.entidadId ?? null}, ${JSON.stringify(entrada.detalle ?? {})})
  `;
};

export const listar = async (limite = 100): Promise<Auditoria[]> => {
  const filas = await sql<FilaAuditoria[]>`
    select * from auditoria_admin order by creado_en desc limit ${limite}
  `;
  return filas.map(aAuditoria);
};
