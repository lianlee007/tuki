-- ============================================================================
--  Tuki — Descubrir: tipo de cocina y búsqueda de platos
-- ============================================================================
--
--  La portada de Tuki dejó de ser la landing de venta: ahora es un buscador de
--  platos. Para eso hacen falta tres cosas que la base no tenía.
--
--  1. `tipos_cocina` — la taxonomía global (cafetería, china, italiana…). Ojo:
--     la tabla `categorias` que ya existía NO es esto; guarda las secciones del
--     menú de cada restaurante ("Sopas", "Entradas") y tiene `restaurante_id`.
--
--  2. `restaurantes_cocinas` — qué cocinas sirve cada restaurante. Es de varios
--     a varios (una cafetería también es panadería) y un índice parcial permite
--     una sola principal por restaurante, que es la que se muestra en la ficha.
--
--  3. `buscar_platos()` — la búsqueda con filtros, el total y la paginación en
--     una sola llamada. Devuelve el plato ya con su restaurante, su cocina
--     principal y su nota media.
--
--  Se añaden `pg_trgm` y `unaccent` para que buscar «cafeteria» encuentre
--  «Cafetería» y para que el índice no se caiga con acentos. `normalizar_
--  busqueda()` es el envoltorio inmutable que exige un índice de expresión.
--
--  Si NO ejecutas este SQL, la portada `/` falla al cargar (pide la función y
--  las tablas). Es la única migración de esta tanda que no es opcional.
--
--  Ejecutar completo en el editor SQL de Supabase.
-- ============================================================================

begin;

create extension if not exists pg_trgm;
create extension if not exists unaccent;

/* -------------------------------------------------------------------------- */
/*  Taxonomía de cocinas (global, no por restaurante)                         */
/* -------------------------------------------------------------------------- */
create table if not exists public.tipos_cocina (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  icono text not null default 'UtensilsCrossed',   -- nombre de un icono de lucide
  orden int not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.tipos_cocina enable row level security;

drop policy if exists tipos_cocina_lectura on public.tipos_cocina;
create policy tipos_cocina_lectura on public.tipos_cocina
  for select to public using (activo);

insert into public.tipos_cocina (slug, nombre, icono, orden) values
  ('local',        'Cocina local',      'UtensilsCrossed', 10),
  ('cafeteria',    'Cafetería',         'Coffee',          20),
  ('panaderia',    'Panadería',         'Croissant',       30),
  ('reposteria',   'Repostería',        'CakeSlice',       40),
  ('pizza',        'Pizzería',          'Pizza',           50),
  ('italiana',     'Italiana',          'Wheat',           60),
  ('china',        'China',             'Soup',            70),
  ('japonesa',     'Japonesa y sushi',  'Fish',            80),
  ('mexicana',     'Mexicana',          'Flame',           90),
  ('peruana',      'Peruana',           'ChefHat',        100),
  ('arabe',        'Árabe',             'HandPlatter',    110),
  ('india',        'India',             'CookingPot',     120),
  ('tailandesa',   'Tailandesa',        'Leaf',           130),
  ('hamburguesas', 'Hamburguesas',      'Sandwich',       140),
  ('asados',       'Parrilla y asados', 'Beef',           150),
  ('mariscos',     'Mariscos',          'Waves',          160),
  ('rapida',       'Comida rápida',     'Truck',          170),
  ('saludable',    'Saludable',         'Salad',          180),
  ('vegetariana',  'Vegetariana',       'Sprout',         190),
  ('vegana',       'Vegana',            'Leaf',           200),
  ('heladeria',    'Heladería',         'IceCreamBowl',   210),
  ('bebidas',      'Bebidas',           'CupSoda',        220),
  ('fusion',       'Fusión',            'Sparkles',       230)
on conflict (slug) do update
  set nombre = excluded.nombre, icono = excluded.icono, orden = excluded.orden;

/* -------------------------------------------------------------------------- */
/*  Asignación restaurante ↔ cocina                                           */
/* -------------------------------------------------------------------------- */
create table if not exists public.restaurantes_cocinas (
  restaurante_id uuid not null references public.restaurantes(id) on delete cascade,
  tipo_cocina_id uuid not null references public.tipos_cocina(id) on delete cascade,
  principal boolean not null default false,
  primary key (restaurante_id, tipo_cocina_id)
);

create unique index if not exists restaurantes_cocinas_una_principal
  on public.restaurantes_cocinas (restaurante_id) where principal;

alter table public.restaurantes_cocinas enable row level security;

-- Lectura pública si el restaurante está publicado; escritura solo para su dueño.
drop policy if exists restaurantes_cocinas_lectura on public.restaurantes_cocinas;
create policy restaurantes_cocinas_lectura on public.restaurantes_cocinas
  for select to public using (
    exists (
      select 1 from public.restaurantes r
      where r.id = restaurantes_cocinas.restaurante_id
        and (r.activo is not false or r.usuario_id = (select auth.uid()))
    )
  );

drop policy if exists restaurantes_cocinas_alta on public.restaurantes_cocinas;
create policy restaurantes_cocinas_alta on public.restaurantes_cocinas
  for insert to authenticated with check (
    exists (
      select 1 from public.restaurantes r
      where r.id = restaurantes_cocinas.restaurante_id
        and r.usuario_id = (select auth.uid())
    )
  );

drop policy if exists restaurantes_cocinas_edicion on public.restaurantes_cocinas;
create policy restaurantes_cocinas_edicion on public.restaurantes_cocinas
  for update to authenticated using (
    exists (
      select 1 from public.restaurantes r
      where r.id = restaurantes_cocinas.restaurante_id
        and r.usuario_id = (select auth.uid())
    )
  );

drop policy if exists restaurantes_cocinas_borrado on public.restaurantes_cocinas;
create policy restaurantes_cocinas_borrado on public.restaurantes_cocinas
  for delete to authenticated using (
    exists (
      select 1 from public.restaurantes r
      where r.id = restaurantes_cocinas.restaurante_id
        and r.usuario_id = (select auth.uid())
    )
  );

/* -------------------------------------------------------------------------- */
/*  Guardar las cocinas de un restaurante (una transacción, del dueño)        */
/* -------------------------------------------------------------------------- */
-- El conjunto se reemplaza entero: el primero del arreglo es la principal. En
-- una sola transacción no existe el estado intermedio «sin cocina» ni se choca
-- con el índice de una sola principal por restaurante.
create or replace function public.guardar_cocinas_restaurante(
  p_restaurante_id uuid,
  p_tipo_cocina_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if coalesce(array_length(p_tipo_cocina_ids, 1), 0) = 0 then
    raise exception 'Elige al menos una cocina';
  end if;

  delete from public.restaurantes_cocinas where restaurante_id = p_restaurante_id;

  insert into public.restaurantes_cocinas (restaurante_id, tipo_cocina_id, principal)
  select p_restaurante_id, t.id, t.orden = 1
  from unnest(p_tipo_cocina_ids) with ordinality as t(id, orden);
end;
$$;

grant execute on function public.guardar_cocinas_restaurante(uuid, uuid[]) to authenticated;

/* -------------------------------------------------------------------------- */
/*  Búsqueda: normalización sin acentos e índices                             */
/* -------------------------------------------------------------------------- */
create or replace function public.normalizar_busqueda(texto text)
returns text
language sql
immutable
parallel safe
set search_path = public
as $$
  select lower(public.unaccent(coalesce(texto, '')));
$$;

create index if not exists platillos_busqueda_trgm
  on public.platillos
  using gin ((public.normalizar_busqueda(nombre || ' ' || coalesce(descripcion, ''))) gin_trgm_ops);

create index if not exists platillos_precio_idx on public.platillos (precio);
create index if not exists restaurantes_ciudad_idx on public.restaurantes (ciudad);

create or replace function public.buscar_platos(
  p_q text default null,
  p_cocina text default null,
  p_precio_min numeric default null,
  p_precio_max numeric default null,
  p_vegetariano boolean default null,
  p_vegano boolean default null,
  p_picante boolean default null,
  p_ciudad text default null,
  p_limite int default 24,
  p_desde int default 0
)
returns table (
  id uuid,
  nombre text,
  descripcion text,
  precio numeric,
  imagen_url text,
  categoria text,
  vegetariano boolean,
  vegano boolean,
  picante boolean,
  restaurante_id uuid,
  restaurante_nombre text,
  ciudad text,
  tipo_cocina text,
  tipo_cocina_slug text,
  rating numeric,
  rating_cantidad bigint,
  total bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with base as (
    select
      p.id,
      p.nombre::text,
      p.descripcion,
      p.precio,
      p.imagen_url::text,
      p.categoria,
      coalesce(p.vegetariano, false) as vegetariano,
      coalesce(p.vegano, false) as vegano,
      coalesce(p.picante, false) as picante,
      r.id as restaurante_id,
      r.nombre::text as restaurante_nombre,
      r.ciudad,
      (
        select tc.nombre
        from public.restaurantes_cocinas rc
        join public.tipos_cocina tc on tc.id = rc.tipo_cocina_id
        where rc.restaurante_id = r.id
        order by rc.principal desc, tc.orden
        limit 1
      ) as tipo_cocina,
      (
        select tc.slug
        from public.restaurantes_cocinas rc
        join public.tipos_cocina tc on tc.id = rc.tipo_cocina_id
        where rc.restaurante_id = r.id
        order by rc.principal desc, tc.orden
        limit 1
      ) as tipo_cocina_slug,
      coalesce((
        select avg(v.calificacion)
        from public.valoraciones v
        where v.restaurante_id = r.id
          and v.platillo_id is null
          and coalesce(v.visible, true)
      ), 0)::numeric as rating,
      (
        select count(*)
        from public.valoraciones v
        where v.restaurante_id = r.id
          and v.platillo_id is null
          and coalesce(v.visible, true)
      ) as rating_cantidad
    from public.platillos p
    join public.restaurantes r on r.id = p.restaurante_id
    where p.activo is not false
      and p.disponible is not false
      and r.activo is not false
      and (
        p_q is null or btrim(p_q) = ''
        or public.normalizar_busqueda(p.nombre || ' ' || coalesce(p.descripcion, ''))
           like '%' || public.normalizar_busqueda(btrim(p_q)) || '%'
        or public.normalizar_busqueda(r.nombre)
           like '%' || public.normalizar_busqueda(btrim(p_q)) || '%'
        or exists (
          select 1
          from public.restaurantes_cocinas rc3
          join public.tipos_cocina tc3 on tc3.id = rc3.tipo_cocina_id
          where rc3.restaurante_id = r.id
            and public.normalizar_busqueda(tc3.nombre)
                like '%' || public.normalizar_busqueda(btrim(p_q)) || '%'
        )
      )
      and (
        p_cocina is null or p_cocina = ''
        or exists (
          select 1
          from public.restaurantes_cocinas rc2
          join public.tipos_cocina tc2 on tc2.id = rc2.tipo_cocina_id
          where rc2.restaurante_id = r.id and tc2.slug = p_cocina
        )
      )
      and (p_precio_min is null or p.precio >= p_precio_min)
      and (p_precio_max is null or p.precio <= p_precio_max)
      and (p_vegetariano is null or coalesce(p.vegetariano, false) = p_vegetariano)
      and (p_vegano is null or coalesce(p.vegano, false) = p_vegano)
      and (p_picante is null or coalesce(p.picante, false) = p_picante)
      and (
        p_ciudad is null or btrim(p_ciudad) = ''
        or public.normalizar_busqueda(coalesce(r.ciudad, ''))
           like '%' || public.normalizar_busqueda(btrim(p_ciudad)) || '%'
      )
  )
  select b.*, count(*) over() as total
  from base b
  order by
    case
      when p_q is null or btrim(p_q) = '' then 0
      when public.normalizar_busqueda(b.nombre) like public.normalizar_busqueda(btrim(p_q)) || '%' then 0
      else 1
    end,
    b.rating desc,
    b.nombre
  limit greatest(1, least(coalesce(p_limite, 24), 60))
  offset greatest(0, coalesce(p_desde, 0));
$$;

grant execute on function public.buscar_platos(text, text, numeric, numeric, boolean, boolean, boolean, text, int, int)
  to anon, authenticated;

/* -------------------------------------------------------------------------- */
/*  Cocinas de los restaurantes sembrados                                     */
/* -------------------------------------------------------------------------- */
with asignaciones(nombre, slug, principal) as (
  values
    ('Asadero Los Arcos',   'asados',     true),
    ('Café Bolívar',        'cafeteria',  true),
    ('Café Bolívar',        'reposteria', false),
    ('Donde Lian',          'fusion',     true),
    ('Donde Lian',          'china',      false),
    ('Fritanga El Fogón',   'local',      true),
    ('Fritanga El Fogón',   'rapida',     false),
    ('Pizzería Centenario', 'pizza',      true),
    ('Pizzería Centenario', 'italiana',   false),
    ('Sabor Payanés',       'local',      true)
)
insert into public.restaurantes_cocinas (restaurante_id, tipo_cocina_id, principal)
select r.id, tc.id, a.principal
from asignaciones a
join public.restaurantes r on r.nombre = a.nombre
join public.tipos_cocina tc on tc.slug = a.slug
on conflict (restaurante_id, tipo_cocina_id) do update set principal = excluded.principal;

commit;
