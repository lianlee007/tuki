-- Campos del perfil y del menú que usa la interfaz original de Tuki.
-- Se añaden con `if not exists` para poder aplicar la migración sobre bases
-- creadas antes de este cambio.

alter table restaurantes
  add column if not exists facebook text,
  add column if not exists instagram text,
  add column if not exists twitter text,
  add column if not exists dias_abierto jsonb not null default '{
    "lunes": true,
    "martes": true,
    "miercoles": true,
    "jueves": true,
    "viernes": true,
    "sabado": true,
    "domingo": true
  }'::jsonb;

alter table platillos
  add column if not exists ingredientes text[] not null default '{}',
  add column if not exists alergenos text[] not null default '{}',
  add column if not exists destacado boolean not null default false,
  add column if not exists tiempo_preparacion int;
