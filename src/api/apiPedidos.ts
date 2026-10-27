import { supabase } from '../lib/supabase';
import type { EstadoPedido, ItemPedido, Pedido } from '../lib/pedidos';

const CAMPOS = `
  id, restaurante_id, usuario_id, nombre_cliente, telefono_cliente,
  direccion_entrega, items, subtotal, total, estado, tipo_pedido,
  created_at, notas_cliente,
  restaurante:restaurantes ( id, nombre, imagen_logo_url, ciudad )
`;

const normalizar = (fila: any): Pedido => ({
  ...fila,
  subtotal: Number(fila.subtotal),
  total: Number(fila.total),
});

/**
 * Pedidos guardados.
 *
 * El mensaje de WhatsApp sigue siendo la fuente de verdad para el restaurante;
 * esta tabla es la copia que permite historial y bandeja. Si el guardado falla,
 * el pedido ya salió por WhatsApp y no se bloquea nada: el llamador ignora el
 * error a propósito.
 */
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
    const total = Number(entrada.total) || 0;
    const { error } = await supabase.from('pedidos').insert({
      restaurante_id: entrada.restauranteId,
      nombre_cliente: entrada.nombre.trim() || 'Comensal',
      telefono_cliente: entrada.telefono.trim(),
      direccion_entrega: entrada.direccion?.trim() || null,
      items: entrada.items,
      subtotal: total,
      total,
      estado: 'pendiente',
      tipo_pedido: entrada.tipoPedido ?? 'entrega',
      notas_cliente: entrada.notas?.trim() || null,
    });

    return { error };
  },

  mios: async (usuarioId: string) => {
    const { data, error } = await supabase
      .from('pedidos')
      .select(CAMPOS)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(50);

    return { pedidos: (data || []).map(normalizar), error };
  },

  delRestaurante: async (restauranteId: string) => {
    const { data, error } = await supabase
      .from('pedidos')
      .select(CAMPOS)
      .eq('restaurante_id', restauranteId)
      .order('created_at', { ascending: false })
      .limit(100);

    return { pedidos: (data || []).map(normalizar), error };
  },

  cambiarEstado: async (id: string, estado: EstadoPedido) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado, updated_at: new Date().toISOString() })
      .eq('id', id);

    return { error };
  },
};
