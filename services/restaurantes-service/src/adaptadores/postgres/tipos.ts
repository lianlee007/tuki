/** Filas crudas de PostgreSQL del servicio de restaurantes. */
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
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  dias_abierto: Record<string, boolean>;
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
  ingredientes: string[];
  alergenos: string[];
  destacado: boolean;
  tiempo_preparacion: number | null;
  orden: number;
}
