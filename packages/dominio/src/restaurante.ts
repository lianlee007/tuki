/** Modelo público de un restaurante y su identidad visual. */
export interface Restaurante {
  id: string;
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
  pais?: string | null;
  imagenLogoUrl: string | null;
  imagenBannerUrl: string | null;
  horarioApertura: string | null;
  horarioCierre: string | null;
  /** Redes sociales del local; la ficha pública las muestra si existen. */
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  /** Días de servicio activos, por nombre en español. */
  diasAbierto?: Record<string, boolean>;
  activo: boolean;
  creadoEn: string;
}

export interface Tema {
  id: string;
  restauranteId: string;
  estiloPlantilla: string;
  colorPrimario: string;
  colorSecundario: string;
  colorFondo: string;
  colorTexto: string;
  colorTextoTitulos: string;
  /** Paleta opcional para el modo oscuro del menú público. */
  colorPrimarioOscuro?: string | null;
  colorSecundarioOscuro?: string | null;
  colorFondoOscuro?: string | null;
  colorTextoOscuro?: string | null;
  colorTextoTitulosOscuro?: string | null;
  fuenteTitulos: string;
  fuenteCuerpo: string;
}

export interface Categoria {
  id: string;
  restauranteId: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  orden: number;
}

export interface Platillo {
  id: string;
  restauranteId: string;
  categoriaId: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagenUrl: string | null;
  disponible: boolean;
  activo: boolean;
  vegetariano: boolean;
  vegano: boolean;
  picante: boolean;
  ingredientes?: string[];
  alergenos?: string[];
  destacado?: boolean;
  tiempoPreparacion?: number | null;
  orden: number;
}

export interface TipoCocina {
  id: string;
  slug: string;
  nombre: string;
  icono: string;
}
