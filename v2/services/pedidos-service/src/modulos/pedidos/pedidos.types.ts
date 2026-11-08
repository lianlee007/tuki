import type {
  EstadoPedido,
  ItemPedido,
  Pedido,
  Rol,
  TipoPedido,
} from '@tuki/dominio';

/** Identidad que llega en el JWT. */
export interface ContextoAutenticacion {
  usuarioId: string;
  rol: Rol;
  email: string;
}

export interface ItemEntrada {
  platilloId: string;
  cantidad: number;
  notas?: string | null;
}

export interface EntradaPedido {
  restauranteId: string;
  items: ItemEntrada[];
  tipoPedido: TipoPedido;
  nombreCliente: string;
  telefonoCliente: string;
  direccionEntrega?: string | null;
  notasCliente?: string | null;
}

/** Ítem ya validado contra el menú, con su subtotal calculado. */
export interface LineaGuardar extends ItemPedido {
  subtotal: number;
}

export interface PedidoCreado extends Pedido {
  whatsappUrl: string;
}

export interface FilaPedido {
  id: string;
  restaurante_id: string;
  usuario_id: string;
  nombre_cliente: string;
  telefono_cliente: string;
  direccion_entrega: string | null;
  tipo_pedido: TipoPedido;
  notas_cliente: string | null;
  subtotal: string;
  total: string;
  estado: EstadoPedido;
  creado_en: Date;
}

export interface FilaItem {
  id: string;
  pedido_id: string;
  platillo_id: string;
  nombre: string;
  precio_unitario: string;
  cantidad: number;
  notas: string | null;
  subtotal: string;
}
