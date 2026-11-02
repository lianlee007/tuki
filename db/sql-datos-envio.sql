-- ============================================================================
-- Datos de envío de la cuenta
-- ----------------------------------------------------------------------------
-- Hasta ahora el teléfono y la dirección vivían solo en `localStorage`: al
-- cambiar de navegador el comensal los perdía y tenía que escribirlos otra vez.
-- La cuenta gana un juego de datos de entrega que se pide al crear la cuenta
-- (se puede omitir) y se puede editar desde «Mi cuenta».
--
-- Las columnas viven en `public.users`, cuya política RLS ya permite que cada
-- persona lea y edite únicamente su propia fila. El correo y el teléfono no se
-- exponen al público: el primero nunca se muestra en una reseña y el segundo
-- solo lo recibe el restaurante que atiende el pedido.
--
-- Se aplica después de `db/sql-clientes.sql`, porque reemplaza la función
-- `handle_new_user()` que crea el perfil.
-- ============================================================================

begin;

/* -------------------------------------------------------------------------- */
/*  Columnas de entrega                                                      */
/* -------------------------------------------------------------------------- */
alter table public.users
  add column if not exists avatar_url text,
  add column if not exists telefono text,
  add column if not exists direccion text,
  add column if not exists barrio text,
  add column if not exists referencias text,
  add column if not exists datos_envio_actualizado_en timestamptz,
  add column if not exists datos_envio_omitidos_en timestamptz;

comment on column public.users.avatar_url is
  'Foto de perfil pública del comensal; se copia a sus reseñas.';
comment on column public.users.telefono is
  'Teléfono de contacto para pedidos. Solo lo lee la propia cuenta.';
comment on column public.users.direccion is
  'Dirección principal de entrega, sin barrio ni referencias.';
comment on column public.users.barrio is
  'Barrio o localidad de la dirección principal.';
comment on column public.users.referencias is
  'Torre, apartamento o punto de referencia para el repartidor.';
comment on column public.users.datos_envio_actualizado_en is
  'Última vez que la cuenta guardó sus datos de envío.';
comment on column public.users.datos_envio_omitidos_en is
  'Última vez que la cuenta decidió completar sus datos más tarde.';

/* Límites alineados con el formulario. El teléfono se guarda solo con dígitos;
   los campos vacíos se escriben como null para no confundirlos con un dato. */
alter table public.users drop constraint if exists users_telefono_valido;
alter table public.users add constraint users_telefono_valido
  check (telefono is null or telefono ~ '^[0-9]{7,15}$');

alter table public.users drop constraint if exists users_datos_envio_longitud;
alter table public.users add constraint users_datos_envio_longitud
  check (
    (direccion is null or char_length(direccion) between 5 and 200)
    and (barrio is null or char_length(barrio) between 2 and 60)
    and (referencias is null or char_length(referencias) <= 160)
  );

/* -------------------------------------------------------------------------- */
/*  Alta: los datos viajan en el metadata del registro                       */
/* -------------------------------------------------------------------------- */
-- El formulario de registro de comensales recolecta la dirección antes de
-- crear la cuenta. Cuando la confirmación por correo está activa no hay sesión
-- todavía, así que el metadata es la única vía fiable para guardarla en el
-- perfil. El trigger normaliza y descarta datos incompletos sin romper el alta.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_telefono text;
  v_direccion text;
  v_barrio text;
  v_referencias text;
  v_omitir boolean;
begin
  v_telefono := left(
    regexp_replace(coalesce(new.raw_user_meta_data->>'telefono', ''), '\D', '', 'g'),
    15
  );
  if char_length(v_telefono) < 7 then
    v_telefono := null;
  end if;

  v_direccion := left(btrim(coalesce(new.raw_user_meta_data->>'direccion', '')), 200);
  if char_length(v_direccion) < 5 then
    v_direccion := null;
  end if;

  v_barrio := left(btrim(coalesce(new.raw_user_meta_data->>'barrio', '')), 60);
  if char_length(v_barrio) < 2 then
    v_barrio := null;
  end if;

  v_referencias := nullif(
    left(btrim(coalesce(new.raw_user_meta_data->>'referencias', '')), 160),
    ''
  );

  v_omitir := coalesce(new.raw_user_meta_data->>'omitir_datos_envio', 'false') = 'true';

  insert into public.users (
    id, email, nombre, apellido, rol,
    telefono, direccion, barrio, referencias,
    datos_envio_actualizado_en, datos_envio_omitidos_en
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', 'Usuario'),
    coalesce(new.raw_user_meta_data->>'apellido', 'Nuevo'),
    case
      when new.raw_user_meta_data->>'rol' = 'restaurante' then 'restaurante'
      else 'cliente'
    end,
    v_telefono,
    v_direccion,
    v_barrio,
    v_referencias,
    case
      when v_telefono is not null and v_direccion is not null then now()
      else null
    end,
    case
      when v_omitir and v_direccion is null then now()
      else null
    end
  )
  on conflict (id) do update set
    email = excluded.email,
    nombre = coalesce(excluded.nombre, users.nombre),
    apellido = coalesce(excluded.apellido, users.apellido),
    telefono = coalesce(excluded.telefono, users.telefono),
    direccion = coalesce(excluded.direccion, users.direccion),
    barrio = coalesce(excluded.barrio, users.barrio),
    referencias = coalesce(excluded.referencias, users.referencias),
    datos_envio_actualizado_en = coalesce(
      excluded.datos_envio_actualizado_en,
      users.datos_envio_actualizado_en
    ),
    datos_envio_omitidos_en = case
      when excluded.datos_envio_actualizado_en is not null then null
      else coalesce(excluded.datos_envio_omitidos_en, users.datos_envio_omitidos_en)
    end;

  return new;
exception when others then
  raise log 'Error en handle_new_user: %', sqlerrm;
  return new;
end;
$$;

commit;
