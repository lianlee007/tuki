-- Auditoría de acciones del superadministrador.
create table if not exists auditoria_admin (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  accion text not null,
  entidad text not null,
  entidad_id text,
  detalle jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);

create index if not exists auditoria_admin_fecha_idx
  on auditoria_admin (creado_en desc);
