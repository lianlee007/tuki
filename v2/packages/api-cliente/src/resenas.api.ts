import type { Resena } from '@tuki/dominio';
import type { ClienteHttp } from './http.js';

export interface EntradaResena {
  restauranteId: string;
  platilloId?: string | null;
  nombreCliente: string;
  calificacion: number;
  comentario?: string;
  fotoUrl?: string | null;
}

export interface ResumenResenas {
  promedio: number;
  cantidad: number;
}

/** Contrato del servicio de reseñas. */
export const crearApiResenas = (http: ClienteHttp) => ({
  listar: (restauranteId: string) =>
    http.solicitar<{ resenas: Resena[]; resumen: ResumenResenas }>(
      `/v1/resenas/restaurante/${encodeURIComponent(restauranteId)}`,
    ),

  mias: () => http.solicitar<{ resenas: Resena[] }>('/v1/resenas/mios'),

  crear: (entrada: EntradaResena) =>
    http.solicitar<Resena>('/v1/resenas', {
      method: 'POST',
      body: JSON.stringify(entrada),
    }),

  eliminar: (resenaId: string) =>
    http.solicitar<void>(`/v1/resenas/${encodeURIComponent(resenaId)}`, {
      method: 'DELETE',
    }),

  marcarUtil: (resenaId: string) =>
    http.solicitar<Resena>(`/v1/resenas/${encodeURIComponent(resenaId)}/util`, {
      method: 'POST',
    }),

  quitarUtil: (resenaId: string) =>
    http.solicitar<Resena>(`/v1/resenas/${encodeURIComponent(resenaId)}/util`, {
      method: 'DELETE',
    }),

  responder: (resenaId: string, respuesta: string) =>
    http.solicitar<Resena>(
      `/v1/resenas/${encodeURIComponent(resenaId)}/respuesta`,
      { method: 'PUT', body: JSON.stringify({ respuesta }) },
    ),

  cambiarVisible: (resenaId: string, visible: boolean) =>
    http.solicitar<Resena>(
      `/v1/resenas/${encodeURIComponent(resenaId)}/visible`,
      { method: 'PATCH', body: JSON.stringify({ visible }) },
    ),
});
