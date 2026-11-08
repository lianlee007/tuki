/** Estados posibles de un pedido. */
export type EstadoPedido =
  | 'pendiente'
  | 'confirmado'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

export type TipoPedido = 'entrega' | 'recoger';

export interface ItemPedido {
  platilloId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  notas?: string | null;
}

export interface Pedido {
  id: string;
  restauranteId: string;
  usuarioId: string | null;
  nombreCliente: string;
  telefonoCliente: string;
  direccionEntrega: string | null;
  items: ItemPedido[];
  subtotal: number;
  total: number;
  estado: EstadoPedido;
  tipoPedido: TipoPedido;
  notasCliente: string | null;
  creadoEn: string;
}

/** Pedido recién creado con el enlace de WhatsApp para el comensal. */
export interface PedidoCreado extends Pedido {
  whatsappUrl: string;
}

/** Regla de transición; vive en el dominio para probarla sin HTTP. */
export const siguienteEstado = (estado: EstadoPedido): EstadoPedido | null => {
  const camino: Partial<Record<EstadoPedido, EstadoPedido>> = {
    pendiente: 'confirmado',
    confirmado: 'en_camino',
    en_camino: 'entregado',
  };
  return camino[estado] ?? null;
};
