import type {
  EntradaActualizarRestaurante,
  EntradaCrearRestaurante,
  EntradaTema,
  FiltrosAdmin,
  Restaurante,
  RestauranteConDueno,
  ResumenRestaurantes,
  Tema,
  TipoCocina,
} from '../dominio/restaurante.js';

export interface ResultadoCreacionRestaurante {
  restaurante: Restaurante;
  tema: Tema | null;
}

export interface ListadoRestaurantesAdmin {
  items: RestauranteConDueno[];
  total: number;
}

/** Puerto de persistencia del perfil, tema, cocinas y administración. */
export interface RestaurantesRepositorio {
  buscarPorId(id: string): Promise<RestauranteConDueno | null>;
  buscarPorDueno(duenoId: string): Promise<RestauranteConDueno | null>;
  existeSlug(slug: string): Promise<boolean>;
  crearConBase(
    entrada: EntradaCrearRestaurante & { slug: string; duenoId: string },
  ): Promise<ResultadoCreacionRestaurante>;
  actualizar(
    id: string,
    entrada: EntradaActualizarRestaurante,
  ): Promise<RestauranteConDueno | null>;
  actualizarTema(id: string, entrada: EntradaTema): Promise<Tema | null>;
  reemplazarCocinas(id: string, cocinas: string[]): Promise<void>;
  cocinasDe(id: string): Promise<TipoCocina[]>;
  temaDe(id: string): Promise<Tema | null>;
  listarCocinas(): Promise<TipoCocina[]>;
  listarTodos(filtros: FiltrosAdmin): Promise<ListadoRestaurantesAdmin>;
  resumen(): Promise<ResumenRestaurantes>;
  cambiarActivo(id: string, activo: boolean): Promise<RestauranteConDueno | null>;
}
