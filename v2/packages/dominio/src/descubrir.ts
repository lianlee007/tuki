import type { Categoria, Platillo, Restaurante, Tema, TipoCocina } from './restaurante.js';

/** Restaurante con los agregados que muestra el buscador. */
export interface RestauranteDescubierto extends Restaurante {
  platosCantidad: number;
  precioMin: number | null;
  precioMax: number | null;
}

/** Plato con restaurante y cocina resueltos para la portada. */
export interface PlatoDescubierto extends Platillo {
  restauranteNombre: string;
  restauranteSlug: string;
  ciudad: string | null;
  cocina: string | null;
}

/** Ficha pública completa de un restaurante. */
export interface RestaurantePublico {
  restaurante: Restaurante;
  tema: Tema;
  cocinas: TipoCocina[];
  categorias: Categoria[];
  platillos: Platillo[];
}

/** Menú público mínimo para el carrito y los pedidos. */
export interface MenuPublico {
  restaurante: {
    id: string;
    nombre: string;
    slug: string;
    whatsapp: string | null;
    telefono: string | null;
  };
  platillos: Platillo[];
}

/** Ficha que ve el dueño en su panel. */
export interface PanelRestaurante extends RestaurantePublico {
  duenoId: string;
}
