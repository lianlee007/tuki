-- Esquema inicial de identidad.
-- No conoce restaurantes ni pedidos: solo cuentas, credenciales y sesiones.

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  nombre text not null,
  apellido text not null,
  rol text not null default 'cliente'
    check (rol in ('cliente', 'dueno', 'superadmin')),
  email_verificado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- El correo se compara sin distinguir mayúsculas sin depender de citext.
create unique index if not exists usuarios_email_unico
  on usuarios (lower(email));

create table if not exists refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  token_hash text not null unique,
  expira_en timestamptz not null,
  revocado_en timestamptz,
  creado_en timestamptz not null default now(),
  user_agent text,
  ip text
);

create index if not exists refresh_tokens_usuario_idx
  on refresh_tokens (usuario_id, expira_en desc);

create table if not exists auditoria_identidad (
  id bigserial primary key,
  usuario_id uuid,
  accion text not null,
  detalle jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);

create index if not exists auditoria_identidad_usuario_idx
  on auditoria_identidad (usuario_id, creado_en desc);
