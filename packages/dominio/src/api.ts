/** Forma única de error que devuelven todos los servicios. */
export interface ErrorApi {
  codigo: string;
  mensaje: string;
  detalles?: unknown;
}

export interface RespuestaError {
  error: ErrorApi;
}

/** Página genérica para listados paginados. */
export interface Pagina<T> {
  items: T[];
  total: number;
  desde: number;
  limite: number;
}
