/** Fila cruda de la auditoría administrativa. */
export interface FilaAuditoria {
  id: string;
  actor_id: string;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalle: Record<string, unknown>;
  creado_en: Date;
}
