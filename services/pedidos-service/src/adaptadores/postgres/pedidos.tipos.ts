import type { EstadoPedido, TipoPedido } from '../../dominio/pedido.js';

/** Fila cruda de PostgreSQL; los `numeric` llegan como texto. */
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
