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
  imagenLogoUrl: string | null;
  imagenBannerUrl: string | null;
  horarioApertura: string | null;
  horarioCierre: string | null;
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
  orden: number;
}

export interface TipoCocina {
  id: string;
  slug: string;
  nombre: string;
  icono: string;
}
