import { siguienteEstado } from '@tuki/dominio';
import type { EstadoPedido, ItemPedido, Pedido, TipoPedido } from '@tuki/dominio';

export type { EstadoPedido, ItemPedido, Pedido, TipoPedido };
export { siguienteEstado };

export interface ItemEntrada {
  platilloId: string;
  cantidad: number;
  notas?: string | null;
}

/** Entrada ya validada por la capa HTTP. */
export interface EntradaCrearPedido {
  restauranteId: string;
  items: ItemEntrada[];
  tipoPedido: TipoPedido;
  nombreCliente: string;
  telefonoCliente: string;
  direccionEntrega?: string | null;
  notasCliente?: string | null;
}

/** Ítem validado contra el menú, con su subtotal calculado en el servidor. */
export interface LineaGuardar extends ItemPedido {
  subtotal: number;
}

export interface PedidoCreado extends Pedido {
  whatsappUrl: string;
}

/**
 * Cancelar solo se permite antes de que el pedido salga del local.
 * El resto de transiciones las define el dominio compartido.
 */
export const esCancelacionPermitida = (
  estadoActual: EstadoPedido,
  estadoNuevo: EstadoPedido,
): boolean =>
  estadoNuevo === 'cancelado' &&
  (estadoActual === 'pendiente' || estadoActual === 'confirmado');

export const esTransicionValida = (
  estadoActual: EstadoPedido,
  estadoNuevo: EstadoPedido,
): boolean =>
  esCancelacionPermitida(estadoActual, estadoNuevo) ||
  siguienteEstado(estadoActual) === estadoNuevo;
