-- ============================================================================
--  Tuki — Dos públicos: clientes y restaurantes
-- ============================================================================
--
--  Hasta hoy toda cuenta era de restaurante: al registrarse se creaba un
--  «Mi Restaurante» vacío y el panel era el único destino. La portada ahora es
--  para comensales, así que la cuenta necesita un papel explícito.
--
--  1. `users.rol` — 'cliente' (comensal) o 'restaurante' (dueño del panel).
--     Las cuentas que ya existían se marcan como restaurante: nacieron cuando
--     el producto solo tenía ese papel. Las nuevas entran como cliente salvo
--     que el formulario de restaurantes pida lo contrario.
--
--  2. `crear_restaurante_predeterminado()` deja de crear un restaurante para
--     todo el mundo. Un cliente que entra no debe aparecer en el directorio.
--
--  3. `buscar_restaurantes()` — el carril de restaurantes de la portada, con
--     el mismo filtro de cocina y de texto que los platos.
--
--  4. `buscar_platos()` también encuentra por restaurante y por cocina. El
--     buscador prometía «un plato, un restaurante o una cocina» y solo miraba
--     el nombre del plato.
--
--  Ejecutar completo en el editor SQL de Supabase.
-- ============================================================================

begin;

/* -------------------------------------------------------------------------- */
/*  Rol de la cuenta                                                          */
/* -------------------------------------------------------------------------- */
alter table public.users add column if not exists rol text;

-- Las cuentas anteriores al cambio eran todas de restaurante.
update public.users set rol = 'restaurante' where rol is null;

alter table public.users alter column rol set default 'cliente';
alter table public.users alter column rol set not null;

alter table public.users drop constraint if exists users_rol_valido;
alter table public.users add constraint users_rol_valido
  check (rol in ('cliente', 'restaurante'));

comment on column public.users.rol is
  'cliente = comensal (carrito y reseñas); restaurante = dueño del panel.';

/* -------------------------------------------------------------------------- */
/*  Alta: el rol llega desde el formulario                                    */
/* -------------------------------------------------------------------------- */
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, nombre, apellido, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', 'Usuario'),
    coalesce(new.raw_user_meta_data->>'apellido', 'Nuevo'),
    case
      when new.raw_user_meta_data->>'rol' = 'restaurante' then 'restaurante'
      else 'cliente'
    end
  )
  on conflict (id) do update set
    email = excluded.email,
    nombre = coalesce(excluded.nombre, users.nombre),
    apellido = coalesce(excluded.apellido, users.apellido);

  return new;
exception when others then
  raise log 'Error en handle_new_user: %', sqlerrm;
  return new;
end;
$$;

/* -------------------------------------------------------------------------- */
/*  Solo un restaurante recibe restaurante, tema y categorías automáticos     */
/* -------------------------------------------------------------------------- */
create or replace function public.crear_restaurante_predeterminado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nuevo_restaurante_id uuid;
begin
  if coalesce(new.rol, 'cliente') <> 'restaurante' then
    return new;
  end if;

  insert into public.restaurantes (
    usuario_id,
    nombre,
    descripcion,
    eslogan,
    horario_apertura,
    horario_cierre
  ) values (
    new.id,
    'Mi Restaurante',
    'Bienvenido a nuestro restaurante. Aquí podrás disfrutar de los mejores platillos.',
    'Buen sabor, mejor servicio',
    '09:00'::time,
    '22:00'::time
  ) returning id into nuevo_restaurante_id;

  insert into public.temas (restaurante_id)
  values (nuevo_restaurante_id);

  insert into public.categorias (restaurante_id, nombre, icono, orden) values
    (nuevo_restaurante_id, 'Entradas', 'appetizer', 1),
    (nuevo_restaurante_id, 'Platos Principales', 'main-dish', 2),
    (nuevo_restaurante_id, 'Postres', 'dessert', 3),
    (nuevo_restaurante_id, 'Bebidas', 'drink', 4);

  return new;
exception when others then
  raise log 'Error en crear_restaurante_predeterminado: %', sqlerrm;
  return new;
end;
$$;

/* -------------------------------------------------------------------------- */
/*  Carril de restaurantes de la portada                                      */
/* -------------------------------------------------------------------------- */
-- Mismos filtros que los platos (texto y cocina) y solo restaurantes con al
-- menos un plato publicado: una tarjeta que lleva a un menú vacío no sirve.
create or replace function public.buscar_restaurantes(
  p_q text default null,
  p_cocina text default null,
  p_limite int default 12,
  p_desde int default 0
)
returns table (
  id uuid,
  nombre text,
  eslogan text,
  descripcion text,
  imagen_banner_url text,
  imagen_logo_url text,
  ciudad text,
  tipo_cocina text,
  tipo_cocina_slug text,
  rating numeric,
  rating_cantidad bigint,
  platos_cantidad bigint,
  precio_min numeric,
  precio_max numeric,
  total bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with base as (
    select
      r.id,
      r.nombre::text,
      r.eslogan,
      r.descripcion,
      r.imagen_banner_url::text,
      r.imagen_logo_url::text,
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
      ) as rating_cantidad,
      (
        select count(*)
        from public.platillos p
        where p.restaurante_id = r.id
          and p.activo is not false
          and p.disponible is not false
      ) as platos_cantidad,
      (
        select min(p.precio)
        from public.platillos p
        where p.restaurante_id = r.id
          and p.activo is not false
          and p.disponible is not false
      ) as precio_min,
      (
        select max(p.precio)
        from public.platillos p
        where p.restaurante_id = r.id
          and p.activo is not false
          and p.disponible is not false
      ) as precio_max
    from public.restaurantes r
    where r.activo is not false
      and (
        p_q is null or btrim(p_q) = ''
        or public.normalizar_busqueda(
             r.nombre || ' ' || coalesce(r.eslogan, '') || ' ' || coalesce(r.descripcion, '')
           ) like '%' || public.normalizar_busqueda(btrim(p_q)) || '%'
        or public.normalizar_busqueda(coalesce((
             select string_agg(tc.nombre, ' ' order by tc.orden)
             from public.restaurantes_cocinas rc
             join public.tipos_cocina tc on tc.id = rc.tipo_cocina_id
             where rc.restaurante_id = r.id
           ), '')) like '%' || public.normalizar_busqueda(btrim(p_q)) || '%'
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
  )
  select
    b.id, b.nombre, b.eslogan, b.descripcion, b.imagen_banner_url,
    b.imagen_logo_url, b.ciudad, b.tipo_cocina, b.tipo_cocina_slug,
    b.rating, b.rating_cantidad, b.platos_cantidad, b.precio_min, b.precio_max,
    count(*) over() as total
  from base b
  where b.platos_cantidad > 0
  order by
    case
      when p_q is null or btrim(p_q) = '' then 0
      when public.normalizar_busqueda(b.nombre) like public.normalizar_busqueda(btrim(p_q)) || '%' then 0
      else 1
    end,
    b.rating desc,
    b.platos_cantidad desc,
    b.nombre
  limit greatest(1, least(coalesce(p_limite, 12), 24))
  offset greatest(0, coalesce(p_desde, 0));
$$;

grant execute on function public.buscar_restaurantes(text, text, int, int)
  to anon, authenticated;

/* -------------------------------------------------------------------------- */
/*  La búsqueda de platos también entiende restaurante y cocina               */
/* -------------------------------------------------------------------------- */
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

commit;
