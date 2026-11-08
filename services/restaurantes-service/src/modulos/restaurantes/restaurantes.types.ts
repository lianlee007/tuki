import type {
  Categoria,
  Platillo,
  Restaurante,
  Rol,
  Tema,
  TipoCocina,
} from '@tuki/dominio';

/** Identidad que llega en el JWT. */
export interface ContextoAutenticacion {
  usuarioId: string;
  rol: Rol;
  email: string;
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

/** Fila cruda de restaurante. */
export interface FilaRestaurante {
  id: string;
  dueno_id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  eslogan: string | null;
  telefono: string | null;
  whatsapp: string | null;
  email: string | null;
  direccion: string | null;
  ciudad: string | null;
  departamento: string | null;
  pais: string | null;
  imagen_logo_url: string | null;
  imagen_banner_url: string | null;
  horario_apertura: string | null;
  horario_cierre: string | null;
  activo: boolean;
  creado_en: Date;
}

export interface FilaTema {
  id: string;
  restaurante_id: string;
  estilo_plantilla: string;
  color_primario: string;
  color_secundario: string;
  color_fondo: string;
  color_texto: string;
  color_texto_titulos: string;
  color_primario_oscuro: string | null;
  color_secundario_oscuro: string | null;
  color_fondo_oscuro: string | null;
  color_texto_oscuro: string | null;
  color_texto_titulos_oscuro: string | null;
  fuente_titulos: string;
  fuente_cuerpo: string;
}

export interface FilaCategoria {
  id: string;
  restaurante_id: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  orden: number;
  activo: boolean;
}

export interface FilaPlatillo {
  id: string;
  restaurante_id: string;
  categoria_id: string | null;
  nombre: string;
  descripcion: string | null;
  precio: string;
  imagen_url: string | null;
  disponible: boolean;
  activo: boolean;
  vegetariano: boolean;
  vegano: boolean;
  picante: boolean;
  orden: number;
}
