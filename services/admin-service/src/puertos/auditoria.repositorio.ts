import type {
  Auditoria,
  EntradaAuditoria,
} from '../dominio/admin.js';

/** Puerto de auditoría local del BFF. */
export interface AuditoriaRepositorio {
  registrar(entrada: EntradaAuditoria): Promise<void>;
  listar(limite?: number): Promise<Auditoria[]>;
}
