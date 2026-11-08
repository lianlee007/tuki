import type {
  MenuPublico,
  Pagina,
  PanelRestaurante,
  PlatoDescubierto,
  RestauranteDescubierto,
  RestaurantePublico,
  TipoCocina,
} from '@tuki/dominio';
import type { ClienteHttp } from './http.js';

export interface FiltrosRestaurantes {
  q?: string;
  cocina?: string;
  ciudad?: string;
  limite?: number;
  desde?: number;
}

export interface FiltrosPlatos extends FiltrosRestaurantes {
  precioMin?: number;
  precioMax?: number;
  vegetariano?: boolean;
  vegano?: boolean;
  picante?: boolean;
}

const consulta = (filtros: object): string => {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      params.set(clave, String(valor));
    }
  }
  const texto = params.toString();
  return texto ? `?${texto}` : '';
};

/** Contrato del servicio de restaurantes. */
export const crearApiRestaurantes = (http: ClienteHttp) => ({
  listar: (filtros: FiltrosRestaurantes = {}) =>
    http.solicitar<Pagina<RestauranteDescubierto>>(
      `/v1/restaurantes${consulta(filtros)}`,
    ),

  cocinas: () =>
    http.solicitar<{ cocinas: TipoCocina[] }>('/v1/restaurantes/cocinas'),

  platos: (filtros: FiltrosPlatos = {}) =>
    http.solicitar<Pagina<PlatoDescubierto>>(
      `/v1/restaurantes/platos${consulta(filtros)}`,
    ),

  ficha: (slug: string) =>
    http.solicitar<RestaurantePublico>(
      `/v1/restaurantes/${encodeURIComponent(slug)}`,
    ),

  menuPublico: (restauranteId: string) =>
    http.solicitar<MenuPublico>(
      `/v1/restaurantes/${encodeURIComponent(restauranteId)}/platos-publicos`,
    ),

  mios: () => http.solicitar<PanelRestaurante>('/v1/restaurantes/mios'),

  panel: (restauranteId: string) =>
    http.solicitar<PanelRestaurante>(
      `/v1/restaurantes/${encodeURIComponent(restauranteId)}/panel`,
    ),

  crear: (entrada: {
    nombre: string;
    slug?: string;
    descripcion?: string;
    ciudad?: string;
    telefono?: string;
    whatsapp?: string;
    cocinas?: string[];
  }) =>
    http.solicitar<{ restaurante: unknown; tema: unknown }>('/v1/restaurantes', {
      method: 'POST',
      body: JSON.stringify(entrada),
    }),

  actualizar: (restauranteId: string, datos: Record<string, unknown>) =>
    http.solicitar<unknown>(`/v1/restaurantes/${restauranteId}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  actualizarTema: (restauranteId: string, datos: Record<string, unknown>) =>
    http.solicitar<unknown>(`/v1/restaurantes/${restauranteId}/tema`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),
});
