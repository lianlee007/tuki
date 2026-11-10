export interface EntradaAuditoria {
  usuarioId?: string;
  accion: string;
  detalle?: Record<string, unknown>;
}

/** Puerto de auditoría de identidad. */
export interface AuditoriaRepositorio {
  registrar(entrada: EntradaAuditoria): Promise<void>;
}
