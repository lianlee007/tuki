-- Esquema del servicio de restaurantes.
-- Posee el local, su identidad visual, sus cocinas, categorías y platillos.
-- No conoce usuarios (solo guarda `dueno_id` como referencia) ni pedidos.

create extension if not exists pg_trgm;
create extension if not exists unaccent;

create table if not exists restaurantes (
  id uuid primary key default gen_random_uuid(),
  dueno_id uuid not null,
  slug text not null unique,
  nombre text not null,
  descripcion text,
  eslogan text,
  telefono text,
  whatsapp text,
  email text,
  direccion text,
  ciudad text,
  departamento text,
  pais text default 'Colombia',
  imagen_logo_url text,
  imagen_banner_url text,
  horario_apertura text default '09:00',
  horario_cierre text default '22:00',
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists restaurantes_dueno_idx on restaurantes (dueno_id);
create index if not exists restaurantes_ciudad_idx on restaurantes (ciudad);

create table if not exists temas (
  id uuid primary key default gen_random_uuid(),
  restaurante_id uuid not null unique references restaurantes(id) on delete cascade,
  estilo_plantilla text not null default 'moderno',
  color_primario text not null default '#EA580C',
  color_secundario text not null default '#16A34A',
  color_fondo text not null default '#FDF8F3',
  color_texto text not null default '#2A1B12',
  color_texto_titulos text not null default '#1A0F08',
  color_primario_oscuro text,
  color_secundario_oscuro text,
  color_fondo_oscuro text,
  color_texto_oscuro text,
  color_texto_titulos_oscuro text,
  fuente_titulos text not null default 'Playfair Display',
  fuente_cuerpo text not null default 'Inter',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists tipos_cocina (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  icono text not null default 'UtensilsCrossed',
  orden int not null default 0,
  activo boolean not null default true
);

create table if not exists restaurantes_cocinas (
  restaurante_id uuid not null references restaurantes(id) on delete cascade,
  tipo_cocina_id uuid not null references tipos_cocina(id) on delete cascade,
  principal boolean not null default false,
  primary key (restaurante_id, tipo_cocina_id)
);

create unique index if not exists restaurantes_cocinas_una_principal
  on restaurantes_cocinas (restaurante_id) where principal;

create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  restaurante_id uuid not null references restaurantes(id) on delete cascade,
  nombre text not null,
  descripcion text,
  icono text,
  orden int not null default 0,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists categorias_restaurante_idx
  on categorias (restaurante_id, orden);

create table if not exists platillos (
  id uuid primary key default gen_random_uuid(),
  restaurante_id uuid not null references restaurantes(id) on delete cascade,
  categoria_id uuid references categorias(id) on delete set null,
  nombre text not null,
  descripcion text,
  precio numeric(12, 2) not null check (precio >= 0),
  imagen_url text,
  disponible boolean not null default true,
  activo boolean not null default true,
  vegetariano boolean not null default false,
  vegano boolean not null default false,
  picante boolean not null default false,
  orden int not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists platillos_restaurante_idx
  on platillos (restaurante_id, activo, orden);
create index if not exists platillos_precio_idx on platillos (precio);

-- Normalización sin acentos para que «cafeteria» encuentre «Cafetería».
create or replace function normalizar_busqueda(texto text)
returns text
language sql
immutable
parallel safe
set search_path = public
as $$
  select lower(public.unaccent(coalesce(texto, '')));
$$;

create index if not exists platillos_busqueda_trgm
  on platillos using gin (
    (normalizar_busqueda(nombre || ' ' || coalesce(descripcion, ''))) gin_trgm_ops
  );

insert into tipos_cocina (slug, nombre, icono, orden) values
  ('local', 'Cocina local', 'UtensilsCrossed', 10),
  ('cafeteria', 'Cafetería', 'Coffee', 20),
  ('panaderia', 'Panadería', 'Croissant', 30),
  ('pizza', 'Pizzería', 'Pizza', 40),
  ('italiana', 'Italiana', 'Wheat', 50),
  ('china', 'China', 'Soup', 60),
  ('japonesa', 'Japonesa y sushi', 'Fish', 70),
  ('mexicana', 'Mexicana', 'Flame', 80),
  ('hamburguesas', 'Hamburguesas', 'Sandwich', 90),
  ('asados', 'Parrilla y asados', 'Beef', 100),
  ('mariscos', 'Mariscos', 'Waves', 110),
  ('rapida', 'Comida rápida', 'Truck', 120),
  ('saludable', 'Saludable', 'Salad', 130),
  ('vegetariana', 'Vegetariana', 'Sprout', 140),
  ('vegana', 'Vegana', 'Leaf', 150),
  ('bebidas', 'Bebidas', 'CupSoda', 160)
on conflict (slug) do nothing;
