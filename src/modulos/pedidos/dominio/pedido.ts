/**
 * Reglas de los pedidos que no dependen de React ni de Supabase.
 *
 * El pedido sigue saliendo por WhatsApp —es el canal real del restaurante—,
 * pero desde la fase B también se guarda una copia en `pedidos` para que el
 * comensal tenga historial y el dueño una bandeja. Aquí se decide cómo se
 * etiqueta, cómo se resume y qué transiciones de estado existen.
 *
 * Este archivo es la capa de dominio del módulo `pedidos`: no importa nada de
 * React, del navegador ni del cliente de Supabase. Se puede probar con Vitest
 * sin montar la aplicación.
 */

export type EstadoPedido =
  | 'pendiente'
  | 'confirmado'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

export type TipoPedido = 'entrega' | 'recoger';

export interface ItemPedido {
  platillo_id?: string | null;
  nombre: string;
  cantidad: number;
  precio: number;
  nota?: string | null;
}

export interface Pedido {
  id: string;
  restaurante_id: string;
  usuario_id?: string | null;
  nombre_cliente: string;
  telefono_cliente?: string | null;
  direccion_entrega?: string | null;
  items: ItemPedido[];
  subtotal: number;
  total: number;
  estado: EstadoPedido | string;
  tipo_pedido?: TipoPedido | string | null;
  created_at: string | null;
  notas_cliente?: string | null;
  restaurante?: {
    id: string;
    nombre: string;
    imagen_logo_url: string | null;
    ciudad: string | null;
  } | null;
}

export const ESTADOS_PEDIDO: EstadoPedido[] = [
  'pendiente',
  'confirmado',
  'en_camino',
  'entregado',
  'cancelado',
];

const ETIQUETAS: Record<EstadoPedido, string> = {
  pendiente: 'Por confirmar',
  confirmado: 'Confirmado',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const ETIQUETA_ESTADO = ETIQUETAS;

export const esEstadoPedido = (valor: unknown): valor is EstadoPedido =>
  typeof valor === 'string' && ESTADOS_PEDIDO.includes(valor as EstadoPedido);

export const etiquetaEstado = (estado: string | null | undefined): string =>
  esEstadoPedido(estado) ? ETIQUETAS[estado] : 'Sin estado';

/** Un pedido sigue vivo mientras no se entregó ni se canceló. */
export const esPedidoActivo = (pedido: Pick<Pedido, 'estado'>): boolean =>
  pedido.estado !== 'entregado' && pedido.estado !== 'cancelado';

/**
 * El siguiente paso natural del pedido. `entregado` y `cancelado` son finales:
 * deshacer una entrega es una decisión humana, no un botón de «siguiente».
 */
export const siguienteEstado = (estado: string): EstadoPedido | null => {
  if (estado === 'pendiente') return 'confirmado';
  if (estado === 'confirmado') return 'en_camino';
  if (estado === 'en_camino') return 'entregado';
  return null;
};

/** Los items pueden llegar como JSON ya parseado o como texto de Postgres. */
export const itemsPedido = (items: unknown): ItemPedido[] => {
  if (Array.isArray(items)) return items as ItemPedido[];
  if (typeof items !== 'string') return [];
  try {
    const parseado = JSON.parse(items);
    return Array.isArray(parseado) ? parseado : [];
  } catch {
    return [];
  }
};

/** «Ajiaco ×2 · Tamal ×1». Vacío si el pedido no trae items legibles. */
export const resumenItems = (items: unknown, maximo = 3): string => {
  const lista = itemsPedido(items);
  if (lista.length === 0) return 'Sin detalle';

  const visibles = lista.slice(0, maximo).map((item) => {
    const cantidad = Number(item.cantidad) || 1;
    return `${item.nombre} ×${cantidad}`;
  });

  const resto = lista.length - visibles.length;
  return resto > 0 ? `${visibles.join(' · ')} · +${resto}` : visibles.join(' · ');
};

export const unidadesPedido = (items: unknown): number =>
  itemsPedido(items).reduce((suma, item) => suma + (Number(item.cantidad) || 0), 0);

/** Código corto para hablar del pedido sin dictar un UUID entero. */
export const codigoPedido = (id: string): string =>
  `#${id.replace(/-/g, '').slice(-6).toUpperCase()}`;

/** «27 oct, 18:30». Una fecha inválida no rompe la bandeja. */
export const fechaPedido = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
};

/** Total en pesos sin decimales: los precios del menú son enteros. */
export const dinero = (valor: number | string | null | undefined): string => {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '$0';
  return `$${Math.round(numero).toLocaleString('es-CO')}`;
};
