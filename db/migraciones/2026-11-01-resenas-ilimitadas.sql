-- ============================================================================
-- Reseñas ilimitadas por comensal
-- ----------------------------------------------------------------------------
-- Antes cada comensal podía dejar una sola reseña por plato y una sola del
-- restaurante en general (índices únicos parciales). Ahora puede escribir
-- todas las reseñas que quiera, sobre el mismo plato, la misma categoría o el
-- local, cada vez que vuelva.
--
-- No se ejecuta sola: se aplica en Supabase (SQL Editor o `supabase db push`).
-- ============================================================================

-- 1. Fuera los topes de una reseña por persona y plato.
drop index if exists public.valoraciones_usuario_plato_unico;
drop index if exists public.valoraciones_usuario_local_unico;

-- 2. Índice no único para que «Mis reseñas» y el panel sigan consultando
--    rápido por autor aunque haya muchas filas.
create index if not exists valoraciones_usuario_fecha
  on public.valoraciones (usuario_id, created_at desc)
  where usuario_id is not null;
