import type {
  Categoria,
  Platillo,
  Restaurante,
  RestauranteConDueno,
  Tema,
  TipoCocina,
} from '../../dominio/restaurante.js';
import type {
  FilaCategoria,
  FilaPlatillo,
  FilaRestaurante,
  FilaTema,
} from './tipos.js';

/** PostgreSQL devuelve `jsonb` como texto; aquí se normaliza a objeto. */
const aDiasAbierto = (valor: unknown): Record<string, boolean> => {
  if (valor && typeof valor === 'object') return valor as Record<string, boolean>;
  if (typeof valor === 'string') {
    try {
      const parseado = JSON.parse(valor);
      return parseado && typeof parseado === 'object'
        ? (parseado as Record<string, boolean>)
        : {};
    } catch {
      return {};
    }
  }
  return {};
};

/** Traduce filas de PostgreSQL al modelo de dominio en camelCase. */
export const aRestaurante = (fila: FilaRestaurante): Restaurante => ({
  id: fila.id,
  slug: fila.slug,
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  eslogan: fila.eslogan,
  telefono: fila.telefono,
  whatsapp: fila.whatsapp,
  email: fila.email,
  direccion: fila.direccion,
  ciudad: fila.ciudad,
  departamento: fila.departamento,
  pais: fila.pais,
  imagenLogoUrl: fila.imagen_logo_url,
  imagenBannerUrl: fila.imagen_banner_url,
  horarioApertura: fila.horario_apertura,
  horarioCierre: fila.horario_cierre,
  facebook: fila.facebook,
  instagram: fila.instagram,
  twitter: fila.twitter,
  diasAbierto: aDiasAbierto(fila.dias_abierto),
  activo: fila.activo,
  creadoEn: fila.creado_en.toISOString(),
});

export const aRestauranteConDueno = (fila: FilaRestaurante): RestauranteConDueno => ({
  ...aRestaurante(fila),
  duenoId: fila.dueno_id,
});

export const aTema = (fila: FilaTema): Tema => ({
  id: fila.id,
  restauranteId: fila.restaurante_id,
  estiloPlantilla: fila.estilo_plantilla,
  colorPrimario: fila.color_primario,
  colorSecundario: fila.color_secundario,
  colorFondo: fila.color_fondo,
  colorTexto: fila.color_texto,
  colorTextoTitulos: fila.color_texto_titulos,
  colorPrimarioOscuro: fila.color_primario_oscuro,
  colorSecundarioOscuro: fila.color_secundario_oscuro,
  colorFondoOscuro: fila.color_fondo_oscuro,
  colorTextoOscuro: fila.color_texto_oscuro,
  colorTextoTitulosOscuro: fila.color_texto_titulos_oscuro,
  fuenteTitulos: fila.fuente_titulos,
  fuenteCuerpo: fila.fuente_cuerpo,
});

export const aCategoria = (fila: FilaCategoria): Categoria => ({
  id: fila.id,
  restauranteId: fila.restaurante_id,
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  icono: fila.icono,
  orden: fila.orden,
});

export const aPlatillo = (fila: FilaPlatillo): Platillo => ({
  id: fila.id,
  restauranteId: fila.restaurante_id,
  categoriaId: fila.categoria_id,
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  precio: Number(fila.precio),
  imagenUrl: fila.imagen_url,
  disponible: fila.disponible,
  activo: fila.activo,
  vegetariano: fila.vegetariano,
  vegano: fila.vegano,
  picante: fila.picante,
  ingredientes: fila.ingredientes ?? [],
  alergenos: fila.alergenos ?? [],
  destacado: fila.destacado,
  tiempoPreparacion: fila.tiempo_preparacion,
  orden: fila.orden,
});

export const aTipoCocina = (fila: {
  id: string;
  slug: string;
  nombre: string;
  icono: string;
}): TipoCocina => ({
  id: fila.id,
  slug: fila.slug,
  nombre: fila.nombre,
  icono: fila.icono,
});
