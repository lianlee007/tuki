-- ============================================================================
-- Reseñas con publicación directa
-- ----------------------------------------------------------------------------
-- Antes, toda reseña nacía con `aprobado = false` y el restaurante tenía que
-- aprobarla antes de que apareciera en la ficha. Ahora la reseña se publica en
-- cuanto el comensal la envía; el dueño solo puede ocultarla si no aporta.
--
-- La migración:
--   1. Publica las reseñas existentes que seguían pendientes.
--   2. Deja `aprobado` en `true` por defecto.
--   3. Abre la política de inserción para que el autor pueda crear la reseña
--      ya publicada.
--   4. Ajusta la lectura pública: basta con no estar oculta.
--
-- No se ejecuta sola: se aplica en Supabase (SQL Editor o `supabase db push`).
-- ============================================================================

-- 1. Las reseñas pendientes dejan de esperar aprobación. Las ocultas siguen
--    ocultas porque conservan `visible = false`.
update public.valoraciones
set aprobado = true
where aprobado is not true;

-- 2. Nuevas filas publicadas por defecto.
alter table public.valoraciones
  alter column aprobado set default true;

-- 3. Lectura pública: se ve salvo que alguien la haya ocultado.
drop policy if exists "valoraciones_lectura_publica" on public.valoraciones;
create policy "valoraciones_lectura_publica"
  on public.valoraciones for select
  using (
    (coalesce(aprobado, true) and coalesce(visible, true))
    or usuario_id = auth.uid()
    or exists (
      select 1
      from public.restaurantes r
      where r.id = valoraciones.restaurante_id
        and r.usuario_id = auth.uid()
    )
  );

-- 4. El autor inserta su reseña ya publicada.
drop policy if exists "valoraciones_insercion_propia" on public.valoraciones;
create policy "valoraciones_insercion_propia"
  on public.valoraciones for insert
  to authenticated
  with check (
    usuario_id = auth.uid()
    and aprobado is not false
    and coalesce(visible, true)
  );

comment on column public.valoraciones.aprobado is
  'Reseña publicada (true) u oculta por el restaurante (false). Ya no requiere aprobación previa.';
