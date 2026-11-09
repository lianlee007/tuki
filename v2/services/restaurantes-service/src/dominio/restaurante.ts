import type {
  Categoria,
  Platillo,
  Restaurante,
  Tema,
  TipoCocina,
} from '@tuki/dominio';

export type { Categoria, Platillo, Restaurante, Tema, TipoCocina };

/** Restaurante con el dueño, necesario para validar propiedad. */
export interface RestauranteConDueno extends Restaurante {
  duenoId: string;
}

/** Respuesta completa de la ficha pública. */
export interface RestaurantePublico {
  restaurante: Restaurante;
  tema: Tema;
  cocinas: TipoCocina[];
  categorias: Categoria[];
  platillos: Platillo[];
}

/** Respuesta del panel del dueño. */
export interface PanelRestaurante extends RestaurantePublico {
  duenoId: string;
}

/** Restaurante con los datos agregados que muestra el buscador. */
export interface RestauranteDescubierto extends Restaurante {
  platosCantidad: number;
  precioMin: number | null;
  precioMax: number | null;
}

/** Plato con el restaurante y la cocina ya resueltos para la portada. */
export interface PlatoDescubierto extends Platillo {
  restauranteNombre: string;
  restauranteSlug: string;
  ciudad: string | null;
  cocina: string | null;
}

/** Menú público que consume el carrito y el servicio de pedidos. */
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

export interface ResumenRestaurantes {
  total: number;
  activos: number;
}

export interface FiltrosListado {
  q?: string;
  cocina?: string;
  ciudad?: string;
  limite: number;
  desde: number;
}

export interface FiltrosPlatos extends FiltrosListado {
  precioMin?: number;
  precioMax?: number;
  vegetariano?: 'true' | 'false';
  vegano?: 'true' | 'false';
  picante?: 'true' | 'false';
}

export interface FiltrosAdmin {
  q?: string;
  limite: number;
  desde: number;
}

export interface EntradaCrearRestaurante {
  nombre: string;
  slug?: string;
  descripcion?: string;
  eslogan?: string;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  horarioApertura?: string;
  horarioCierre?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  diasAbierto?: Record<string, boolean>;
  cocinas: string[];
}

export type EntradaActualizarRestaurante = Partial<
  Omit<EntradaCrearRestaurante, 'slug' | 'cocinas'>
>;

export interface EntradaTema {
  estiloPlantilla?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  colorFondo?: string;
  colorTexto?: string;
  colorTextoTitulos?: string;
  colorPrimarioOscuro?: string;
  colorSecundarioOscuro?: string;
  colorFondoOscuro?: string;
  colorTextoOscuro?: string;
  colorTextoTitulosOscuro?: string;
  fuenteTitulos?: string;
  fuenteCuerpo?: string;
}

export interface EntradaCategoria {
  nombre: string;
  descripcion?: string;
  icono?: string;
  orden: number;
}

export type EntradaActualizarCategoria = Partial<EntradaCategoria>;

export interface EntradaPlatillo {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoriaId?: string | null;
  imagenUrl?: string | null;
  disponible: boolean;
  vegetariano: boolean;
  vegano: boolean;
  picante: boolean;
  activo?: boolean;
  ingredientes: string[];
  alergenos: string[];
  destacado: boolean;
  tiempoPreparacion?: number | null;
  orden: number;
}

export type EntradaActualizarPlatillo = Partial<EntradaPlatillo>;
