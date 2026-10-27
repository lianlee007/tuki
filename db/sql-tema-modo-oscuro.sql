-- ============================================================================
--  Tuki — Guardar la paleta del modo oscuro
-- ============================================================================
--
--  Cada paleta del panel tiene DOS juegos de colores: uno para el modo claro y
--  otro para el modo oscuro, que elige el visitante desde la propia página del
--  restaurante.
--
--  La tabla `temas` solo guarda el modo claro. Al añadir estas cinco columnas,
--  el modo oscuro queda guardado tal cual se diseñó.
--
--  Si NO ejecutas este SQL, la aplicación sigue funcionando sin errores:
--  el modo oscuro se calcula automáticamente a partir de la paleta clara
--  (conservando su tono y saturación). El único caso en el que la diferencia se
--  nota es en paletas cuyo acento oscuro es de otro color a propósito
--  (por ejemplo "Tinta y Oro": acento gris en claro, dorado en oscuro).
--
--  Cómo aplicarlo: Supabase → SQL Editor → pegar → Run. Es una sola vez.
-- ============================================================================

alter table public.temas
  add column if not exists color_primario_oscuro      text,
  add column if not exists color_secundario_oscuro    text,
  add column if not exists color_fondo_oscuro         text,
  add column if not exists color_texto_oscuro         text,
  add column if not exists color_texto_titulos_oscuro text;

-- Opcional: rellenar los temas existentes con la paleta "Naranja Brasa"
-- (solo si esas columnas están vacías; no toca nada que ya tenga valor).
update public.temas
set
  color_primario_oscuro      = coalesce(color_primario_oscuro,      '#FB923C'),
  color_secundario_oscuro    = coalesce(color_secundario_oscuro,    '#34D399'),
  color_fondo_oscuro         = coalesce(color_fondo_oscuro,         '#140C08'),
  color_texto_oscuro         = coalesce(color_texto_oscuro,         '#F7EDE6'),
  color_texto_titulos_oscuro = coalesce(color_texto_titulos_oscuro, '#FFFFFF');
