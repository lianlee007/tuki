import type {
  Categoria,
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
    eslogan?: string;
    ciudad?: string;
    departamento?: string;
    telefono?: string;
    whatsapp?: string;
    email?: string;
    direccion?: string;
    horarioApertura?: string;
    horarioCierre?: string;
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

  crearCategoria: (restauranteId: string, datos: { nombre: string; orden?: number }) =>
    http.solicitar<unknown>(`/v1/restaurantes/${restauranteId}/categorias`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  categorias: (restauranteId: string) =>
    http.solicitar<{ categorias: Categoria[] }>(
      `/v1/restaurantes/${encodeURIComponent(restauranteId)}/categorias`,
    ),

  eliminarCategoria: (restauranteId: string, categoriaId: string) =>
    http.solicitar<void>(
      `/v1/restaurantes/${encodeURIComponent(restauranteId)}/categorias/${encodeURIComponent(categoriaId)}`,
      { method: 'DELETE' },
    ),

  actualizarCocinas: (restauranteId: string, cocinas: string[]) =>
    http.solicitar<unknown>(
      `/v1/restaurantes/${encodeURIComponent(restauranteId)}/cocinas`,
      { method: 'PUT', body: JSON.stringify({ cocinas }) },
    ),

  crearPlatillo: (
    restauranteId: string,
    datos: {
      nombre: string;
      precio: number;
      categoriaId?: string | null;
      descripcion?: string;
      disponible?: boolean;
      vegetariano?: boolean;
      vegano?: boolean;
      picante?: boolean;
    },
  ) =>
    http.solicitar<unknown>(`/v1/restaurantes/${restauranteId}/platillos`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  eliminarPlatillo: (restauranteId: string, platilloId: string) =>
    http.solicitar<void>(
      `/v1/restaurantes/${restauranteId}/platillos/${platilloId}`,
      { method: 'DELETE' },
    ),

  actualizarPlatillo: (
    restauranteId: string,
    platilloId: string,
    datos: Record<string, unknown>,
  ) =>
    http.solicitar<unknown>(
      `/v1/restaurantes/${encodeURIComponent(restauranteId)}/platillos/${encodeURIComponent(platilloId)}`,
      { method: 'PUT', body: JSON.stringify(datos) },
    ),

  disponibilidadPlatillo: (
    restauranteId: string,
    platilloId: string,
    disponible: boolean,
  ) =>
    http.solicitar<unknown>(
      `/v1/restaurantes/${restauranteId}/platillos/${platilloId}/disponibilidad`,
      { method: 'PATCH', body: JSON.stringify({ disponible }) },
    ),
});
