-- Pedidos e ítems. El pedido guarda copia del nombre y precio del plato para
-- que el historial no dependa de cambios posteriores en el menú.
create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  restaurante_id uuid not null,
  usuario_id uuid not null,
  nombre_cliente text not null,
  telefono_cliente text not null,
  direccion_entrega text,
  tipo_pedido text not null default 'entrega'
    check (tipo_pedido in ('entrega', 'recoger')),
  notas_cliente text,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  total numeric(12, 2) not null check (total >= 0),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'confirmado', 'en_camino', 'entregado', 'cancelado')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists pedidos_usuario_idx
  on pedidos (usuario_id, creado_en desc);
create index if not exists pedidos_restaurante_idx
  on pedidos (restaurante_id, creado_en desc);

create table if not exists pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  platillo_id uuid not null,
  nombre text not null,
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),
  cantidad int not null check (cantidad > 0),
  notas text,
  subtotal numeric(12, 2) not null check (subtotal >= 0)
);

create index if not exists pedido_items_pedido_idx on pedido_items (pedido_id);
