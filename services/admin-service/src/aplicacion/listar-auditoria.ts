import type { Auditoria } from '../dominio/admin.js';
import type { AuditoriaRepositorio } from '../puertos/auditoria.repositorio.js';

/** Caso de uso: últimas acciones administrativas. */
export const listarAuditoria =
  ({ auditoria }: { auditoria: AuditoriaRepositorio }) =>
  (): Promise<Auditoria[]> =>
    auditoria.listar(100);
