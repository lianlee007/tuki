/**
 * Repositorio de pedidos sobre el servicio de pedidos.
 *
 * El pedido sigue saliendo por WhatsApp —es el canal real del restaurante— y
 * además queda registrado para el historial del comensal y la bandeja del
 * dueño. Los precios y el total los recalcula el servidor.
 */
import { apis, aPedido, intentar } from '../../../lib/api-tuki';
import type { EstadoPedido, ItemPedido, Pedido } from '../dominio/pedido';

export const apiPedidos = {
  crear: async (entrada: {
    restauranteId: string;
    nombre: string;
    telefono: string;
    direccion?: string | null;
    items: ItemPedido[];
    total: number;
    notas?: string | null;
    tipoPedido?: 'entrega' | 'recoger';
  }) => {
    const { error } = await intentar(() =>
      apis.pedidos.crear({
        restauranteId: entrada.restauranteId,
        tipoPedido: entrada.tipoPedido ?? 'entrega',
        nombreCliente: entrada.nombre.trim() || 'Comensal',
        telefonoCliente: entrada.telefono.trim(),
        direccionEntrega: entrada.direccion?.trim() || undefined,
        notasCliente: entrada.notas?.trim() || undefined,
        items: entrada.items
          .filter((item) => Boolean(item.platillo_id))
          .map((item) => ({
            platilloId: item.platillo_id as string,
            cantidad: item.cantidad,
            notas: item.nota ?? undefined,
          })),
      }),
    );

    return { error };
  },

  mios: async (_usuarioId: string) => {
    const { data, error } = await intentar(() => apis.pedidos.mios());
    return { pedidos: (data?.pedidos ?? []).map(aPedido) as Pedido[], error };
  },

  delRestaurante: async (restauranteId: string) => {
    const { data, error } = await intentar(() => apis.pedidos.porRestaurante(restauranteId));
    return { pedidos: (data?.pedidos ?? []).map(aPedido) as Pedido[], error };
  },

  cambiarEstado: async (id: string, estado: EstadoPedido) => {
    return intentar(() => apis.pedidos.cambiarEstado(id, estado));
  },
};
