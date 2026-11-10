#!/bin/sh
# Crea las bases y usuarios de TukiTuki en la primera inicialización de
# PostgreSQL. Los nombres son fijos; las contraseñas vienen del entorno del
# contenedor y no se escriben en el repositorio.
set -eu

: "${POSTGRES_USER:?POSTGRES_USER es obligatorio}"
: "${IDENTIDAD_DB_PASSWORD:?IDENTIDAD_DB_PASSWORD es obligatorio}"
: "${RESTAURANTES_DB_PASSWORD:?RESTAURANTES_DB_PASSWORD es obligatorio}"
: "${MEDIA_DB_PASSWORD:?MEDIA_DB_PASSWORD es obligatorio}"
: "${PEDIDOS_DB_PASSWORD:?PEDIDOS_DB_PASSWORD es obligatorio}"
: "${RESENAS_DB_PASSWORD:?RESENAS_DB_PASSWORD es obligatorio}"

crear_rol_y_base() {
  rol="$1"
  base="$2"
  clave="$3"

  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
    --set=rol="$rol" --set=clave="$clave" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'rol', :'clave')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'rol') \gexec
SQL

  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
    --set=rol="$rol" --set=base="$base" <<'SQL'
SELECT format('CREATE DATABASE %I OWNER %I', :'base', :'rol')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'base') \gexec
SQL
}

crear_rol_y_base tuki_identidad tuki_identidad "$IDENTIDAD_DB_PASSWORD"
crear_rol_y_base tuki_restaurantes tuki_restaurantes "$RESTAURANTES_DB_PASSWORD"
crear_rol_y_base tuki_media tuki_media "$MEDIA_DB_PASSWORD"
crear_rol_y_base tuki_pedidos tuki_pedidos "$PEDIDOS_DB_PASSWORD"
crear_rol_y_base tuki_resenas tuki_resenas "$RESENAS_DB_PASSWORD"

# tuki_admin ya existe como POSTGRES_USER; solo falta su base lógica.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  --set=rol="$POSTGRES_USER" --set=base=tuki_admin <<'SQL'
SELECT format('CREATE DATABASE %I OWNER %I', :'base', :'rol')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'base') \gexec
SQL
