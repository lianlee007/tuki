/** Reseña pública de un restaurante o de un platillo. */
export interface Resena {
  id: string;
  restauranteId: string;
  platilloId: string | null;
  usuarioId: string | null;
  nombreCliente: string;
  calificacion: number;
  comentario: string | null;
  fotoUrl: string | null;
  respuestaDueno: string | null;
  utiles: number;
  creadoEn: string;
}
