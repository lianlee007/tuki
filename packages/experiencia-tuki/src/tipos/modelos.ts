
export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
}

export interface Restaurante {
  id: string;
  usuario_id: string;
  nombre: string;
  descripcion: string;
  eslogan: string;
  telefono: string;
  email: string;
  direccion: string;
  /** Departamento de Colombia (división DANE). Ver `DEPARTAMENTOS` en `lib/colombia.ts`. */
  departamento: string;
  /** Municipio dentro de ese departamento. */
  municipio: string;
  ciudad: string;
  pais: string;
  codigo_postal: string;
  facebook: string;
  instagram: string;
  twitter: string;
  whatsapp: string;
  horario_apertura: string;
  horario_cierre: string;
  dias_abierto: {
    lunes: boolean;
    martes: boolean;
    miercoles: boolean;
    jueves: boolean;
    viernes: boolean;
    sabado: boolean;
    domingo: boolean;
    [dia: string]: boolean;
  };
  imagen_logo_url: string;
  imagen_banner_url: string;
  moneda: string;
  idioma: string;
  /* Columnas que existen en la base de datos y no siempre viajan al formulario. */
  imagen_logo_public_id?: string;
  imagen_banner_public_id?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type EstiloPlantilla =
  | 'moderno'      // Tarjetas
  | 'carta'        // Carta
  | 'minimalista'  // Minimal
  | 'grid'         // Editorial
  | 'inmersivo'    // Inmersivo
  | 'vitrina'      // Vitrina
  | 'mosaico'      // Mosaico
  | 'diptico'      // Díptico
  | 'compacta';    // Compacta

export interface Tema {
  id: string;
  restaurante_id: string;
  color_primario: string;
  color_secundario: string;
  color_fondo: string;
  color_texto: string;
  color_texto_titulos: string;
  fuente_titulos: string;
  fuente_cuerpo: string;
  estilo_plantilla: EstiloPlantilla;
  /** Colores para modo oscuro (si no se definen, se derivan automáticamente). */
  color_fondo_oscuro?: string;
  color_texto_oscuro?: string;
  color_texto_titulos_oscuro?: string;
  color_primario_oscuro?: string;
  color_secundario_oscuro?: string;
}

export interface Categoria {
  id: string;
  restaurante_id: string;
  nombre: string;
  icono: string;
  orden: number;
}

/**
 * Taxonomía global de cocinas (cafetería, china, italiana…). No tiene
 * `restaurante_id`: es la misma para todos y la comparten los filtros.
 */
export interface TipoCocina {
  id: string;
  slug: string;
  nombre: string;
  /** Nombre del icono de lucide (ver `componentes/descubrir/iconosCocina.ts`). */
  icono: string;
  orden: number;
}

/** Un plato tal como lo devuelve `buscar_platos`, ya con su restaurante. */
export interface PlatoDescubierto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
  categoria: string | null;
  vegetariano: boolean;
  vegano: boolean;
  picante: boolean;
  restaurante_id: string;
  restaurante_nombre: string;
  ciudad: string | null;
  tipo_cocina: string | null;
  tipo_cocina_slug: string | null;
  rating: number;
  rating_cantidad: number;
  /** Total de resultados del filtro, no solo de la página. */
  total: number;
}

/** Un restaurante tal como lo devuelve `buscar_restaurantes`. */
export interface RestauranteDescubierto {
  id: string;
  nombre: string;
  eslogan: string | null;
  descripcion: string | null;
  imagen_banner_url: string | null;
  imagen_logo_url: string | null;
  ciudad: string | null;
  tipo_cocina: string | null;
  tipo_cocina_slug: string | null;
  rating: number;
  rating_cantidad: number;
  /** Platos publicados y disponibles: una tarjeta nunca lleva a un menú vacío. */
  platos_cantidad: number;
  precio_min: number | null;
  precio_max: number | null;
  total: number;
}

export interface FiltrosRestaurantes {
  q?: string;
  cocina?: string;
  limite?: number;
  desde?: number;
}

export interface FiltrosDescubrir {
  q?: string;
  cocina?: string;
  precioMin?: number;
  precioMax?: number;
  vegetariano?: boolean;
  vegano?: boolean;
  picante?: boolean;
  /** Se admite para más adelante; la interfaz no lo muestra todavía. */
  ciudad?: string;
  limite?: number;
  desde?: number;
}

export interface Platillo {
  id: string;
  restaurante_id: string;
  categoria_id?: string;
  categoria: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string;
  ingredientes: string[];
  alergenos: string[];
  vegetariano: boolean;
  vegano: boolean;
  picante: boolean;
  disponible: boolean;
  visible: boolean;
  destacado: boolean;
  activo?: boolean; // Compatibilidad con lógica anterior
  tiempo_preparacion?: number;
}
