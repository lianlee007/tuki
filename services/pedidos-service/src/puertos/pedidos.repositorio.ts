import type {
  EstadoPedido,
  LineaGuardar,
  Pedido,
  TipoPedido,
} from '../dominio/pedido.js';

export interface EntradaCrearPedidoRepositorio {
  restauranteId: string;
  usuarioId: string;
  nombreCliente: string;
  telefonoCliente: string;
  direccionEntrega: string | null;
  tipoPedido: TipoPedido;
  notasCliente: string | null;
  subtotal: number;
  total: number;
  items: LineaGuardar[];
}

export interface ResumenPedidos {
  total: number;
  pendientes: number;
  ingresos: number;
}

/**
 * Puerto de persistencia. La aplicación solo conoce esta interfaz; PostgreSQL
 * es un detalle que vive en `adaptadores/postgres`.
 */
export interface PedidosRepositorio {
  crear(entrada: EntradaCrearPedidoRepositorio): Promise<Pedido>;
  buscarPorId(id: string): Promise<Pedido | null>;
  listarPorUsuario(usuarioId: string): Promise<Pedido[]>;
  listarPorRestaurante(restauranteId: string): Promise<Pedido[]>;
  actualizarEstado(id: string, estado: EstadoPedido): Promise<Pedido | null>;
  resumen(): Promise<ResumenPedidos>;
}
