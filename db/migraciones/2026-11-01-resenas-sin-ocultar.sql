-- ============================================================================
-- Reseñas sin ocultamiento por parte del restaurante
-- ----------------------------------------------------------------------------
-- Las reseñas ya se publicaban al enviarse, pero el dueño todavía podía
-- ocultarlas y restaurarlas. Ahora son siempre públicas: el restaurante solo
-- puede leerlas y responderlas.
--
-- La migración:
--   1. Publica cualquier reseña que siguiera marcada como oculta.
--   2. Deja `aprobado` y `visible` en `true` por defecto.
--   3. Simplifica la lectura: todas las reseñas son públicas.
--   4. Limita la actualización del dueño a `respuesta_dueno`.
--
-- No se ejecuta sola: se aplica en Supabase (SQL Editor o `supabase db push`).
-- ============================================================================

-- 1. Ninguna reseña queda oculta.
update public.valoraciones
set aprobado = true,
    visible = true
where aprobado is not true
   or visible is not true;

-- 2. Nuevas filas siempre públicas.
alter table public.valoraciones
  alter column aprobado set default true,
  alter column visible set default true;

-- 3. Lectura pública sin condiciones.
drop policy if exists "valoraciones_lectura_publica" on public.valoraciones;
create policy "valoraciones_lectura_publica"
  on public.valoraciones for select
  using (true);

-- 4. El autor inserta su reseña; el dueño ya no puede ocultarla.
drop policy if exists "valoraciones_insercion_propia" on public.valoraciones;
create policy "valoraciones_insercion_propia"
  on public.valoraciones for insert
  to authenticated
  with check (usuario_id = auth.uid());

-- La política de actualización del dueño sigue vigente para responder, pero
-- a nivel de columnas solo `respuesta_dueno` es actualizable.
revoke update on public.valoraciones from anon, authenticated;
grant update (respuesta_dueno) on public.valoraciones to authenticated;

comment on column public.valoraciones.aprobado is
  'Siempre true: la reseña se publica al enviarse y el restaurante no puede ocultarla.';
comment on column public.valoraciones.visible is
  'Siempre true: la reseña se publica al enviarse y el restaurante no puede ocultarla.';
