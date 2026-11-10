import type {
  Categoria,
  EntradaActualizarCategoria,
  EntradaActualizarPlatillo,
  EntradaCategoria,
  EntradaPlatillo,
  Platillo,
} from '../dominio/restaurante.js';

/** Puerto de persistencia de categorías y platillos. */
export interface MenuRepositorio {
  listarCategorias(restauranteId: string): Promise<Categoria[]>;
  crearCategoria(
    restauranteId: string,
    entrada: EntradaCategoria,
  ): Promise<Categoria | null>;
  actualizarCategoria(
    restauranteId: string,
    categoriaId: string,
    entrada: EntradaActualizarCategoria,
  ): Promise<Categoria | null>;
  eliminarCategoria(restauranteId: string, categoriaId: string): Promise<boolean>;

  listarPlatillos(restauranteId: string): Promise<Platillo[]>;
  crearPlatillo(
    restauranteId: string,
    entrada: EntradaPlatillo,
  ): Promise<Platillo | null>;
  actualizarPlatillo(
    restauranteId: string,
    platilloId: string,
    entrada: EntradaActualizarPlatillo,
  ): Promise<Platillo | null>;
  eliminarPlatillo(restauranteId: string, platilloId: string): Promise<boolean>;
  cambiarDisponibilidad(
    restauranteId: string,
    platilloId: string,
    disponible: boolean,
  ): Promise<Platillo | null>;
}
