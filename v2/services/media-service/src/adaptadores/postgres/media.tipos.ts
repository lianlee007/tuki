/** Fila cruda de PostgreSQL; `bytes` llega como texto por el bigint. */
export interface FilaMedia {
  id: string;
  usuario_id: string;
  destino: string;
  key: string;
  content_type: string;
  bytes: string;
  creado_en: Date;
}
