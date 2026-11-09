/** Fila cruda de PostgreSQL. `utiles` llega como texto por el count. */
export interface FilaResena {
  id: string;
  restaurante_id: string;
  platillo_id: string | null;
  usuario_id: string;
  nombre_cliente: string;
  calificacion: number;
  comentario: string | null;
  foto_url: string | null;
  respuesta_dueno: string | null;
  visible: boolean;
  creado_en: Date;
  utiles: string;
}
