-- ============================================================================
-- Reseñas de Tuki — fase A
-- ----------------------------------------------------------------------------
-- La tabla `valoraciones` ya existía con nota, comentario, plato, nombre y
-- moderación. Esta migración añade lo que la capa social necesita para no
-- exponer datos personales y para saber quién escribió cada reseña.
--
-- No se ejecuta sola: se aplica en Supabase (SQL Editor o `supabase db push`).
-- La aplicación funciona sin las columnas nuevas; cuando están, las usa.
-- ============================================================================

alter table public.valoraciones
  add column if not exists usuario_id uuid references auth.users (id) on delete set null,
  add column if not exists foto_url text,
  add column if not exists respuesta_dueno text,
  add column if not exists nombre_cliente text;

-- El cliente no envía `usuario_id`: lo pone la base de datos con la sesión.
alter table public.valoraciones
  alter column usuario_id set default auth.uid();

-- La reseña se publica al enviarse: no espera aprobación del restaurante.
alter table public.valoraciones
  alter column aprobado set default true,
  alter column visible set default true;

-- El comensal puede reseñar sin límite: el mismo plato, la misma categoría o
-- el restaurante en general, tantas veces como quiera. No hay índice único que
-- bloquee una segunda reseña.
drop index if exists public.valoraciones_usuario_plato_unico;
drop index if exists public.valoraciones_usuario_local_unico;

create index if not exists valoraciones_usuario_fecha
  on public.valoraciones (usuario_id, created_at desc)
  where usuario_id is not null;

create index if not exists valoraciones_restaurante_fecha
  on public.valoraciones (restaurante_id, created_at desc);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.valoraciones enable row level security;

drop policy if exists "valoraciones_lectura_publica" on public.valoraciones;
create policy "valoraciones_lectura_publica"
  on public.valoraciones for select
  using (true);

drop policy if exists "valoraciones_insercion_propia" on public.valoraciones;
create policy "valoraciones_insercion_propia"
  on public.valoraciones for insert
  to authenticated
  with check (usuario_id = auth.uid());

drop policy if exists "valoraciones_moderacion_dueno" on public.valoraciones;
create policy "valoraciones_moderacion_dueno"
  on public.valoraciones for update
  to authenticated
  using (
    exists (
      select 1
      from public.restaurantes r
      where r.id = valoraciones.restaurante_id
        and r.usuario_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.restaurantes r
      where r.id = valoraciones.restaurante_id
        and r.usuario_id = auth.uid()
    )
  );

-- El correo se guarda para contacto interno, pero no se sirve al cliente.
-- Las consultas de la aplicación piden columnas explícitas; esta revocación
-- cierra la puerta a un `select *` desde el navegador.
revoke select (email_cliente) on public.valoraciones from anon, authenticated;

-- El dueño solo puede actualizar su respuesta. Aprobar u ocultar queda fuera
-- de su alcance, incluso llamando directamente a la API.
revoke update on public.valoraciones from anon, authenticated;
grant update (respuesta_dueno) on public.valoraciones to authenticated;

comment on column public.valoraciones.usuario_id is
  'Cuenta que escribió la reseña. Se rellena con auth.uid() al insertar.';
comment on column public.valoraciones.foto_url is
  'Foto opcional de la reseña. Requiere un bucket de Storage con políticas.';
comment on column public.valoraciones.respuesta_dueno is
  'Respuesta pública del dueño del restaurante.';
