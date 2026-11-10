-- Reseñas y votos de utilidad. La calificación es del restaurante, no del plato.
create table if not exists resenas (
  id uuid primary key default gen_random_uuid(),
  restaurante_id uuid not null,
  platillo_id uuid,
  usuario_id uuid not null,
  nombre_cliente text not null,
  calificacion int not null check (calificacion between 1 and 5),
  comentario text,
  foto_url text,
  respuesta_dueno text,
  visible boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists resenas_restaurante_idx
  on resenas (restaurante_id, creado_en desc);
create index if not exists resenas_usuario_idx
  on resenas (usuario_id, creado_en desc);

create table if not exists resenas_utiles (
  resena_id uuid not null references resenas(id) on delete cascade,
  usuario_id uuid not null,
  creado_en timestamptz not null default now(),
  primary key (resena_id, usuario_id)
);
