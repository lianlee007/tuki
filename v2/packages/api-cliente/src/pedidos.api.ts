import type { EstadoPedido, Pedido, PedidoCreado, TipoPedido } from '@tuki/dominio';
import type { ClienteHttp } from './http.js';

export interface EntradaPedido {
  restauranteId: string;
  items: { platilloId: string; cantidad: number; notas?: string }[];
  tipoPedido: TipoPedido;
  nombreCliente: string;
  telefonoCliente: string;
  direccionEntrega?: string;
  notasCliente?: string;
}

/** Contrato del servicio de pedidos. */
export const crearApiPedidos = (http: ClienteHttp) => ({
  crear: (entrada: EntradaPedido) =>
    http.solicitar<PedidoCreado>('/v1/pedidos', {
      method: 'POST',
      body: JSON.stringify(entrada),
    }),

  mios: () => http.solicitar<{ pedidos: Pedido[] }>('/v1/pedidos/mios'),

  porRestaurante: (restauranteId: string) =>
    http.solicitar<{ pedidos: Pedido[] }>(
      `/v1/pedidos/restaurante/${encodeURIComponent(restauranteId)}`,
    ),

  obtener: (pedidoId: string) =>
    http.solicitar<Pedido>(`/v1/pedidos/${encodeURIComponent(pedidoId)}`),

  cambiarEstado: (pedidoId: string, estado: EstadoPedido) =>
    http.solicitar<Pedido>(`/v1/pedidos/${encodeURIComponent(pedidoId)}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),
});
