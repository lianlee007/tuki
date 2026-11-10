/**
 * Puente entre la interfaz heredada de TukiTuki y los microservicios de v2.
 *
 * La interfaz original hablaba con Supabase y trabajaba con nombres en
 * snake_case. Aquí se centraliza la traducción: los componentes siguen usando
 * sus tipos de siempre y este archivo decide qué servicio responde y cómo se
 * nombran los campos.
 */
import { crearApis, ErrorHttp } from '@tuki/api-cliente';
import { leerTokens } from '@tuki/auth-react';
import type {
  Categoria as CategoriaDto,
  Pedido as PedidoDto,
  Platillo as PlatilloDto,
  PlatoDescubierto,
  Resena as ResenaDto,
  Restaurante as RestauranteDto,
  RestauranteDescubierto,
  Tema as TemaDto,
  TipoCocina as TipoCocinaDto,
} from '@tuki/dominio';
import type {
  Categoria,
  PlatoDescubierto as PlatoLegado,
  Platillo,
  Restaurante,
  RestauranteDescubierto as RestauranteLegado,
  Tema,
  TipoCocina,
} from '../tipos/modelos';
import type { Pedido } from '../modulos/pedidos/dominio/pedido';
import type { Resena } from '../modulos/resenas/dominio/resenas';

const entorno = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

/**
 * Configuración inyectada en tiempo de ejecución (`/config.js`).
 * Permite que la misma imagen funcione en local y en Kubernetes sin recompilar.
 */
type ClaveServicio =
  | 'identidad'
  | 'restaurantes'
  | 'media'
  | 'pedidos'
  | 'resenas'
  | 'admin'
  | 'ai';

const configRuntime = (globalThis as { __TUKI_CONFIG__?: Partial<Record<ClaveServicio, string>> })
  .__TUKI_CONFIG__ ?? {};

const servicio = (clave: ClaveServicio, variable: string, defecto: string): string => {
  const delRuntime = configRuntime[clave];
  if (delRuntime) return delRuntime.replace(/\/+$/, '');
  const delBuild = entorno[variable];
  return delBuild && delBuild !== '' ? delBuild : defecto;
};

/** URL base del AI Gateway, compartida con `servicioGroq`. */
export const urlGatewaysIa = (): string =>
  servicio('ai', 'VITE_AI_GATEWAY_URL', 'http://localhost:8000');

/** Cliente único de los servicios, con el token de la sesión actual. */
export const apis = crearApis({
  urls: {
    identidad: servicio('identidad', 'VITE_IDENTIDAD_URL', 'http://localhost:3001'),
    restaurantes: servicio('restaurantes', 'VITE_RESTAURANTES_URL', 'http://localhost:3002'),
    media: servicio('media', 'VITE_MEDIA_URL', 'http://localhost:3003'),
    pedidos: servicio('pedidos', 'VITE_PEDIDOS_URL', 'http://localhost:3004'),
    resenas: servicio('resenas', 'VITE_RESENAS_URL', 'http://localhost:3005'),
    admin: servicio('admin', 'VITE_ADMIN_URL', 'http://localhost:3006'),
  },
  obtenerToken: () => leerTokens().accessToken,
});

/** Error con la forma que espera la interfaz heredada (`message` y `code`). */
export interface ErrorUi {
  message: string;
  code?: string;
  details?: unknown;
}

export interface Resultado<T> {
  data: T;
  error: ErrorUi | null;
}

export const aErrorUi = (error: unknown): ErrorUi => {
  if (error instanceof ErrorHttp) {
    return { message: error.message, code: error.codigo, details: error.detalles };
  }
  if (error instanceof Error) return { message: error.message };
  return { message: 'Ocurrió un error inesperado.' };
};

/** Ejecuta una llamada y devuelve `{ data, error }` como el cliente anterior. */
export const intentar = async <T>(llamada: () => Promise<T>): Promise<Resultado<T | null>> => {
  try {
    return { data: await llamada(), error: null };
  } catch (error) {
    return { data: null, error: aErrorUi(error) };
  }
};

// ---------------------------------------------------------------------------
// Traducciones de los modelos nuevos (camelCase) al modelo heredado
// ---------------------------------------------------------------------------

const diasPorDefecto = {
  lunes: true,
  martes: true,
  miercoles: true,
  jueves: true,
  viernes: true,
  sabado: true,
  domingo: true,
};

/** El servicio puede devolver `jsonb` como texto; se normaliza aquí. */
const diasDe = (valor: unknown): Record<string, boolean> => {
  if (valor && typeof valor === 'object') return valor as Record<string, boolean>;
  if (typeof valor === 'string') {
    try {
      const parseado = JSON.parse(valor);
      return parseado && typeof parseado === 'object'
        ? (parseado as Record<string, boolean>)
        : diasPorDefecto;
    } catch {
      return diasPorDefecto;
    }
  }
  return diasPorDefecto;
};

export const aRestaurante = (dto: RestauranteDto & { duenoId?: string }): Restaurante => ({
  id: dto.id,
  usuario_id: dto.duenoId ?? '',
  nombre: dto.nombre,
  descripcion: dto.descripcion ?? '',
  eslogan: dto.eslogan ?? '',
  telefono: dto.telefono ?? '',
  email: dto.email ?? '',
  direccion: dto.direccion ?? '',
  departamento: dto.departamento ?? '',
  municipio: dto.ciudad ?? '',
  ciudad: dto.ciudad ?? '',
  pais: 'Colombia',
  codigo_postal: '',
  facebook: dto.facebook ?? '',
  instagram: dto.instagram ?? '',
  twitter: dto.twitter ?? '',
  whatsapp: dto.whatsapp ?? '',
  horario_apertura: dto.horarioApertura ?? '09:00',
  horario_cierre: dto.horarioCierre ?? '22:00',
  dias_abierto: { ...diasPorDefecto, ...diasDe(dto.diasAbierto) },
  imagen_logo_url: dto.imagenLogoUrl ?? '',
  imagen_banner_url: dto.imagenBannerUrl ?? '',
  moneda: 'COP',
  idioma: 'es',
  activo: dto.activo,
  created_at: dto.creadoEn,
});

/** Campos que el servicio de restaurantes entiende al guardar el perfil. */
export const aRestauranteDto = (datos: Partial<Restaurante>): Record<string, unknown> => {
  const salida: Record<string, unknown> = {};
  if (datos.nombre !== undefined) salida.nombre = datos.nombre;
  if (datos.descripcion !== undefined) salida.descripcion = datos.descripcion;
  if (datos.eslogan !== undefined) salida.eslogan = datos.eslogan;
  if (datos.telefono !== undefined) salida.telefono = datos.telefono;
  if (datos.whatsapp !== undefined) salida.whatsapp = datos.whatsapp;
  if (datos.email !== undefined) salida.email = datos.email;
  if (datos.direccion !== undefined) salida.direccion = datos.direccion;
  if (datos.ciudad !== undefined) salida.ciudad = datos.ciudad;
  if (datos.departamento !== undefined) salida.departamento = datos.departamento;
  if (datos.horario_apertura !== undefined) salida.horarioApertura = datos.horario_apertura;
  if (datos.horario_cierre !== undefined) salida.horarioCierre = datos.horario_cierre;
  if (datos.imagen_logo_url !== undefined) salida.imagenLogoUrl = datos.imagen_logo_url || null;
  if (datos.imagen_banner_url !== undefined) salida.imagenBannerUrl = datos.imagen_banner_url || null;
  if (datos.facebook !== undefined) salida.facebook = datos.facebook;
  if (datos.instagram !== undefined) salida.instagram = datos.instagram;
  if (datos.twitter !== undefined) salida.twitter = datos.twitter;
  if (datos.dias_abierto !== undefined) salida.diasAbierto = datos.dias_abierto;
  return salida;
};

export const aTema = (dto: TemaDto): Tema => ({
  id: dto.id,
  restaurante_id: dto.restauranteId,
  color_primario: dto.colorPrimario,
  color_secundario: dto.colorSecundario,
  color_fondo: dto.colorFondo,
  color_texto: dto.colorTexto,
  color_texto_titulos: dto.colorTextoTitulos,
  fuente_titulos: dto.fuenteTitulos,
  fuente_cuerpo: dto.fuenteCuerpo,
  estilo_plantilla: dto.estiloPlantilla as Tema['estilo_plantilla'],
});

export const aTemaDto = (datos: Partial<Tema>): Record<string, unknown> => {
  const salida: Record<string, unknown> = {};
  if (datos.color_primario !== undefined) salida.colorPrimario = datos.color_primario;
  if (datos.color_secundario !== undefined) salida.colorSecundario = datos.color_secundario;
  if (datos.color_fondo !== undefined) salida.colorFondo = datos.color_fondo;
  if (datos.color_texto !== undefined) salida.colorTexto = datos.color_texto;
  if (datos.color_texto_titulos !== undefined) salida.colorTextoTitulos = datos.color_texto_titulos;
  if (datos.fuente_titulos !== undefined) salida.fuenteTitulos = datos.fuente_titulos;
  if (datos.fuente_cuerpo !== undefined) salida.fuenteCuerpo = datos.fuente_cuerpo;
  if (datos.estilo_plantilla !== undefined) salida.estiloPlantilla = datos.estilo_plantilla;
  return salida;
};

export const aCategoria = (dto: CategoriaDto): Categoria => ({
  id: dto.id,
  restaurante_id: dto.restauranteId,
  nombre: dto.nombre,
  icono: dto.icono ?? 'UtensilsCrossed',
  orden: dto.orden,
});

export const aPlatillo = (
  dto: PlatilloDto,
  categorias: { id: string; nombre: string }[] = [],
): Platillo => {
  const categoria = categorias.find((item) => item.id === dto.categoriaId);
  return {
    id: dto.id,
    restaurante_id: dto.restauranteId,
    categoria_id: dto.categoriaId ?? undefined,
    categoria: categoria?.nombre ?? '',
    nombre: dto.nombre,
    descripcion: dto.descripcion ?? '',
    precio: Number(dto.precio),
    imagen_url: dto.imagenUrl ?? '',
    ingredientes: dto.ingredientes ?? [],
    alergenos: dto.alergenos ?? [],
    vegetariano: dto.vegetariano,
    vegano: dto.vegano,
    picante: dto.picante,
    disponible: dto.disponible,
    visible: dto.activo,
    destacado: dto.destacado ?? false,
    activo: dto.activo,
    tiempo_preparacion: dto.tiempoPreparacion ?? undefined,
  };
};

export const aTipoCocina = (dto: TipoCocinaDto): TipoCocina => ({
  id: dto.id,
  slug: dto.slug,
  nombre: dto.nombre,
  icono: dto.icono,
  orden: 0,
});

export const aPlatoDescubierto = (dto: PlatoDescubierto): PlatoLegado => ({
  id: dto.id,
  nombre: dto.nombre,
  descripcion: dto.descripcion,
  precio: Number(dto.precio),
  imagen_url: dto.imagenUrl,
  categoria: null,
  vegetariano: dto.vegetariano,
  vegano: dto.vegano,
  picante: dto.picante,
  ingredientes: dto.ingredientes ?? [],
  alergenos: dto.alergenos ?? [],
  destacado: dto.destacado ?? false,
  restaurante_id: dto.restauranteId,
  restaurante_nombre: dto.restauranteNombre,
  ciudad: dto.ciudad,
  tipo_cocina: dto.cocina,
  tipo_cocina_slug: null,
  rating: 0,
  rating_cantidad: 0,
  total: 0,
});

export const aRestauranteDescubierto = (
  dto: RestauranteDescubierto,
  total: number,
): RestauranteLegado => ({
  id: dto.id,
  nombre: dto.nombre,
  eslogan: dto.eslogan,
  descripcion: dto.descripcion,
  imagen_banner_url: dto.imagenBannerUrl,
  imagen_logo_url: dto.imagenLogoUrl,
  ciudad: dto.ciudad,
  tipo_cocina: null,
  tipo_cocina_slug: null,
  rating: 0,
  rating_cantidad: 0,
  platos_cantidad: dto.platosCantidad,
  precio_min: dto.precioMin,
  precio_max: dto.precioMax,
  total,
});

export const aPedido = (dto: PedidoDto): Pedido => ({
  id: dto.id,
  restaurante_id: dto.restauranteId,
  usuario_id: dto.usuarioId,
  nombre_cliente: dto.nombreCliente,
  telefono_cliente: dto.telefonoCliente,
  direccion_entrega: dto.direccionEntrega,
  items: dto.items.map((item) => ({
    platillo_id: item.platilloId,
    nombre: item.nombre,
    cantidad: item.cantidad,
    precio: item.precioUnitario,
    nota: item.notas ?? null,
  })),
  subtotal: Number(dto.subtotal),
  total: Number(dto.total),
  estado: dto.estado,
  tipo_pedido: dto.tipoPedido,
  created_at: dto.creadoEn,
  notas_cliente: dto.notasCliente,
});

export const aResena = (dto: ResenaDto): Resena => ({
  id: dto.id,
  restaurante_id: dto.restauranteId,
  calificacion: dto.calificacion,
  comentario: dto.comentario,
  created_at: dto.creadoEn,
  nombre_cliente: dto.nombreCliente,
  platillo_id: dto.platilloId,
  aprobado: true,
  visible: true,
  foto_url: dto.fotoUrl,
  foto_autor_url: null,
  utiles: dto.utiles,
  respuesta_dueno: dto.respuestaDueno,
});
