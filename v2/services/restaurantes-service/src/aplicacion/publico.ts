import { errorNoEncontrado } from '../dominio/errores.js';
import type {
  FiltrosListado,
  FiltrosPlatos,
  RestaurantePublico,
} from '../dominio/restaurante.js';
import type { DependenciasRestaurantes } from './dependencias.js';

/** Caso de uso: ficha pública por slug. */
export const fichaPublica =
  ({ publico }: DependenciasRestaurantes) =>
  async (slug: string): Promise<RestaurantePublico> => {
    const ficha = await publico.obtenerPublico(slug);
    if (!ficha) throw errorNoEncontrado('No encontramos ese restaurante.');
    return ficha;
  };

/** Caso de uso: carril de restaurantes de la portada. */
export const listarRestaurantes =
  ({ publico }: DependenciasRestaurantes) =>
  (filtros: FiltrosListado) =>
    publico.listarRestaurantes(filtros);

/** Caso de uso: buscador de platos del comensal. */
export const buscarPlatos =
  ({ publico }: DependenciasRestaurantes) =>
  (filtros: FiltrosPlatos) =>
    publico.buscarPlatos(filtros);

/** Caso de uso: tipos de cocina disponibles. */
export const listarCocinas =
  ({ restaurantes }: DependenciasRestaurantes) =>
  () =>
    restaurantes.listarCocinas();

/** Caso de uso: menú público por id para el carrito y pedidos. */
export const menuPublico =
  ({ publico }: DependenciasRestaurantes) =>
  async (restauranteId: string) => {
    const menu = await publico.obtenerMenuPublico(restauranteId);
    if (!menu) throw errorNoEncontrado('No encontramos ese restaurante.');
    return menu;
  };
