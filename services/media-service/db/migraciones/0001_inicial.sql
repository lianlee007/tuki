-- Metadatos de los archivos. El objeto vive en MinIO/S3, no en PostgreSQL.
create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  destino text not null check (destino in ('platillos', 'restaurantes', 'resenas')),
  key text not null unique,
  content_type text not null,
  bytes bigint not null,
  creado_en timestamptz not null default now()
);

create index if not exists media_assets_usuario_idx
  on media_assets (usuario_id, creado_en desc);
