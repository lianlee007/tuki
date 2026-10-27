-- ============================================================================
-- Cuenta del comensal y pedidos — fase A/B
-- ----------------------------------------------------------------------------
-- Dos huecos de la capa social:
--
-- 1. El comensal no puede borrar su propia reseña. La política de borrado es
--    suya y de nadie más: el dueño modera, no borra.
-- 2. La tabla `pedidos` existe desde el inicio pero no tiene políticas, así
--    que el pedido solo vive en el mensaje de WhatsApp. Se añade la cuenta que
--    pidió, la lectura para el comensal y para el dueño, y la edición del
--    estado solo para el restaurante.
--
-- Se aplica en Supabase (SQL Editor, `supabase db push` o MCP). La SPA
-- funciona sin las políticas nuevas; cuando están, guarda y muestra el
-- historial.
-- ============================================================================

-- --- 1. Reseñas: borrar la propia -------------------------------------------

drop policy if exists "valoraciones_borrado_propio" on public.valoraciones;
create policy "valoraciones_borrado_propio"
  on public.valoraciones for delete
  to authenticated
  using (usuario_id = auth.uid());

-- --- 2. Pedidos: cuenta, lectura y bandeja ----------------------------------

alter table public.pedidos
  add column if not exists usuario_id uuid references auth.users (id) on delete set null;

-- El cliente no envía `usuario_id`: lo pone la base de datos con la sesión.
-- Para una visita sin cuenta `auth.uid()` es null y el pedido queda huérfano
-- (solo lo ve el restaurante), que es exactamente lo que queremos.
alter table public.pedidos
  alter column usuario_id set default auth.uid();

create index if not exists pedidos_restaurante_fecha
  on public.pedidos (restaurante_id, created_at desc);

create index if not exists pedidos_usuario_fecha
  on public.pedidos (usuario_id, created_at desc);

alter table public.pedidos enable row level security;

-- Estados que entiende la interfaz. Un pedido nace pendiente y solo el
-- restaurante lo mueve; cancelar no borra la fila.
alter table public.pedidos drop constraint if exists pedidos_estado_valido;
alter table public.pedidos add constraint pedidos_estado_valido
  check (estado in ('pendiente', 'confirmado', 'en_camino', 'entregado', 'cancelado'));

drop policy if exists "pedidos_alta_cliente" on public.pedidos;
create policy "pedidos_alta_cliente"
  on public.pedidos for insert
  to authenticated
  with check (usuario_id = auth.uid());

drop policy if exists "pedidos_lectura" on public.pedidos;
create policy "pedidos_lectura"
  on public.pedidos for select
  to authenticated
  using (
    usuario_id = auth.uid()
    or exists (
      select 1
      from public.restaurantes r
      where r.id = pedidos.restaurante_id
        and r.usuario_id = auth.uid()
    )
  );

drop policy if exists "pedidos_edicion_dueno" on public.pedidos;
create policy "pedidos_edicion_dueno"
  on public.pedidos for update
  to authenticated
  using (
    exists (
      select 1
      from public.restaurantes r
      where r.id = pedidos.restaurante_id
        and r.usuario_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.restaurantes r
      where r.id = pedidos.restaurante_id
        and r.usuario_id = auth.uid()
    )
  );

-- Ningún visitante sin sesión lee pedidos; el correo y el teléfono no salen
-- del panel del restaurante ni del historial del propio comensal.
revoke select (email_cliente, telefono_cliente) on public.pedidos from anon;

comment on column public.pedidos.usuario_id is
  'Cuenta que hizo el pedido. Se rellena con auth.uid() al insertar.';
comment on column public.pedidos.items is
  'Arreglo JSON con { platillo_id, nombre, cantidad, precio, nota }.';
