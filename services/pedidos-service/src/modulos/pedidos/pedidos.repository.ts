import { sql } from '../../db/cliente.js';
import type { EstadoPedido, ItemPedido, Pedido } from '@tuki/dominio';
import type { FilaItem, FilaPedido, LineaGuardar } from './pedidos.types.js';

const aItem = (fila: FilaItem): ItemPedido => ({
  platilloId: fila.platillo_id,
  nombre: fila.nombre,
  precioUnitario: Number(fila.precio_unitario),
  cantidad: fila.cantidad,
  notas: fila.notas,
});

const aPedido = (fila: FilaPedido, items: FilaItem[]): Pedido => ({
  id: fila.id,
  restauranteId: fila.restaurante_id,
  usuarioId: fila.usuario_id,
  nombreCliente: fila.nombre_cliente,
  telefonoCliente: fila.telefono_cliente,
  direccionEntrega: fila.direccion_entrega,
  items: items.map(aItem),
  subtotal: Number(fila.subtotal),
  total: Number(fila.total),
  estado: fila.estado,
  tipoPedido: fila.tipo_pedido,
  notasCliente: fila.notas_cliente,
  creadoEn: fila.creado_en.toISOString(),
});

const itemsDe = async (pedidoIds: string[]): Promise<FilaItem[]> => {
  if (pedidoIds.length === 0) return [];
  return sql<FilaItem[]>`
    select * from pedido_items
    where pedido_id = any(${pedidoIds}::uuid[])
    order by nombre
  `;
};

const agrupar = (filas: FilaItem[]) => {
  const mapa = new Map<string, FilaItem[]>();
  for (const fila of filas) {
    const lista = mapa.get(fila.pedido_id) ?? [];
    lista.push(fila);
    mapa.set(fila.pedido_id, lista);
  }
  return mapa;
};

export const crear = async (entrada: {
  restauranteId: string;
  usuarioId: string;
  nombreCliente: string;
  telefonoCliente: string;
  direccionEntrega: string | null;
  tipoPedido: 'entrega' | 'recoger';
  notasCliente: string | null;
  subtotal: number;
  total: number;
  items: LineaGuardar[];
}): Promise<Pedido> => {
  const id = await sql.begin(async (tx) => {
    const [pedido] = await tx<{ id: string }[]>`
      insert into pedidos (
        restaurante_id, usuario_id, nombre_cliente, telefono_cliente,
        direccion_entrega, tipo_pedido, notas_cliente, subtotal, total
      ) values (
        ${entrada.restauranteId}, ${entrada.usuarioId}, ${entrada.nombreCliente},
        ${entrada.telefonoCliente}, ${entrada.direccionEntrega}, ${entrada.tipoPedido},
        ${entrada.notasCliente}, ${entrada.subtotal}, ${entrada.total}
      )
      returning id
    `;
    if (!pedido) throw new Error('No se pudo crear el pedido.');

    for (const item of entrada.items) {
      await tx`
        insert into pedido_items (
          pedido_id, platillo_id, nombre, precio_unitario, cantidad, notas, subtotal
        ) values (
          ${pedido.id}, ${item.platilloId}, ${item.nombre}, ${item.precioUnitario},
          ${item.cantidad}, ${item.notas ?? null}, ${item.subtotal}
        )
      `;
    }

    return pedido.id;
  });

  const creado = await buscarPorId(id);
  if (!creado) throw new Error('No se pudo leer el pedido creado.');
  return creado;
};

export const buscarPorId = async (id: string): Promise<Pedido | null> => {
  const [fila] = await sql<FilaPedido[]>`select * from pedidos where id = ${id} limit 1`;
  if (!fila) return null;
  const items = await itemsDe([id]);
  return aPedido(fila, items);
};

export const listarPorUsuario = async (usuarioId: string): Promise<Pedido[]> => {
  const filas = await sql<FilaPedido[]>`
    select * from pedidos where usuario_id = ${usuarioId}
    order by creado_en desc limit 50
  `;
  const items = agrupar(await itemsDe(filas.map((fila) => fila.id)));
  return filas.map((fila) => aPedido(fila, items.get(fila.id) ?? []));
};

export const listarPorRestaurante = async (restauranteId: string): Promise<Pedido[]> => {
  const filas = await sql<FilaPedido[]>`
    select * from pedidos where restaurante_id = ${restauranteId}
    order by creado_en desc limit 100
  `;
  const items = agrupar(await itemsDe(filas.map((fila) => fila.id)));
  return filas.map((fila) => aPedido(fila, items.get(fila.id) ?? []));
};

export const actualizarEstado = async (
  id: string,
  estado: EstadoPedido,
): Promise<Pedido | null> => {
  const [fila] = await sql<FilaPedido[]>`
    update pedidos set estado = ${estado}, actualizado_en = now()
    where id = ${id}
    returning *
  `;
  if (!fila) return null;
  const items = await itemsDe([id]);
  return aPedido(fila, items);
};

/** Totales globales para el panel de administración. */
export const resumen = async (): Promise<{
  total: number;
  pendientes: number;
  ingresos: number;
}> => {
  const [fila] = await sql<{
    total: string;
    pendientes: string;
    ingresos: string;
  }[]>`
    select
      count(*)::text as total,
      count(*) filter (where estado = 'pendiente')::text as pendientes,
      coalesce(sum(total) filter (where estado <> 'cancelado'), 0)::text as ingresos
    from pedidos
  `;
  return {
    total: Number(fila?.total ?? 0),
    pendientes: Number(fila?.pendientes ?? 0),
    ingresos: Number(fila?.ingresos ?? 0),
  };
};
