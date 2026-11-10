import type { AuditoriaRepositorio } from '../../puertos/auditoria.repositorio.js';
import { sql } from './cliente.js';

/** Adaptador PostgreSQL del puerto `AuditoriaRepositorio`. */
export const crearRepositorioAuditoria = (): AuditoriaRepositorio => ({
  registrar: async (entrada) => {
    await sql`
      insert into auditoria_identidad (usuario_id, accion, detalle)
      values (${entrada.usuarioId ?? null}, ${entrada.accion},
              ${JSON.stringify(entrada.detalle ?? {})})
    `;
  },
});
