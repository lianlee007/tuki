-- ============================================================================
-- Reseñas: foto del autor y botón «Es útil»
-- ----------------------------------------------------------------------------
-- 1. `users.avatar_url` guarda la foto de perfil del comensal.
-- 2. `valoraciones.foto_autor_url` congela esa foto en la reseña, porque la
--    fila de `users` solo la puede leer su dueño y la ficha es pública.
-- 3. `resenas_utiles` registra un «me gusta» por cuenta y reseña. La clave
--    primaria compuesta impide votar dos veces y el conteo se puede leer desde
--    cualquier navegador.
--
-- No se ejecuta sola: se aplica en Supabase (SQL Editor o `supabase db push`).
-- ============================================================================

begin;

-- 1. Foto de perfil del comensal.
alter table public.users
  add column if not exists avatar_url text;

comment on column public.users.avatar_url is
  'Foto de perfil pública del comensal. Se copia a cada reseña al publicarla.';

-- 2. Foto del autor dentro de la reseña.
alter table public.valoraciones
  add column if not exists foto_autor_url text;

comment on column public.valoraciones.foto_autor_url is
  'Copia de users.avatar_url al publicar: permite pintar el avatar en la ficha sin exponer la fila privada del comensal.';

-- 3. Votos «Es útil».
create table if not exists public.resenas_utiles (
  resena_id uuid not null references public.valoraciones (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (resena_id, usuario_id)
);

create index if not exists resenas_utiles_resena
  on public.resenas_utiles (resena_id);

alter table public.resenas_utiles enable row level security;

drop policy if exists "resenas_utiles_lectura_publica" on public.resenas_utiles;
create policy "resenas_utiles_lectura_publica"
  on public.resenas_utiles for select
  using (true);

drop policy if exists "resenas_utiles_insercion_propia" on public.resenas_utiles;
create policy "resenas_utiles_insercion_propia"
  on public.resenas_utiles for insert
  to authenticated
  with check (usuario_id = auth.uid());

drop policy if exists "resenas_utiles_borrado_propio" on public.resenas_utiles;
create policy "resenas_utiles_borrado_propio"
  on public.resenas_utiles for delete
  to authenticated
  using (usuario_id = auth.uid());

grant select on public.resenas_utiles to anon, authenticated;
grant insert, delete on public.resenas_utiles to authenticated;

comment on table public.resenas_utiles is
  'Un «Es útil» por cuenta y reseña; el conteo es público y el voto es propio.';

commit;
