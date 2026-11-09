import type { MenuRepositorio } from '../puertos/menu.repositorio.js';
import type { PublicoRepositorio } from '../puertos/publico.repositorio.js';
import type { RestaurantesRepositorio } from '../puertos/restaurantes.repositorio.js';

/** Dependencias comunes de los casos de uso de restaurantes. */
export interface DependenciasRestaurantes {
  restaurantes: RestaurantesRepositorio;
  menu: MenuRepositorio;
  publico: PublicoRepositorio;
}
