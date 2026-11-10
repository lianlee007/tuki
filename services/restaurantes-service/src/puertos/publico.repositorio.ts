import type {
  FiltrosListado,
  FiltrosPlatos,
  MenuPublico,
  PlatoDescubierto,
  RestauranteDescubierto,
  RestaurantePublico,
} from '../dominio/restaurante.js';

export interface ListadoDescubierto {
  items: RestauranteDescubierto[];
  total: number;
}

export interface ListadoPlatos {
  items: PlatoDescubierto[];
  total: number;
}

/** Puerto de lectura pública: ficha, portada, buscador y menú del carrito. */
export interface PublicoRepositorio {
  obtenerPublico(slug: string): Promise<RestaurantePublico | null>;
  listarRestaurantes(filtros: FiltrosListado): Promise<ListadoDescubierto>;
  buscarPlatos(filtros: FiltrosPlatos): Promise<ListadoPlatos>;
  obtenerMenuPublico(restauranteId: string): Promise<MenuPublico | null>;
}
