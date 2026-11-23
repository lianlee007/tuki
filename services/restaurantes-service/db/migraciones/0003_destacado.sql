-- Los restaurantes destacados encabezan el listado público.
-- Donde Lian queda primero porque es el local principal de la demo.
alter table restaurantes
  add column if not exists destacado boolean not null default false;

create index if not exists restaurantes_destacado_idx
  on restaurantes (destacado desc, nombre);

update restaurantes
set destacado = (slug = 'donde-lian');
