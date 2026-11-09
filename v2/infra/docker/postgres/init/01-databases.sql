-- Bases y usuarios de Tuki v2.
-- Cada microservicio tiene su propia base lógica y su propio usuario.
-- En local comparten instancia; en producción se pueden separar sin cambiar
-- el código, solo la cadena de conexión.

create role tuki_identidad login password 'tuki_identidad_dev';
create database tuki_identidad owner tuki_identidad;

create role tuki_restaurantes login password 'tuki_restaurantes_dev';
create database tuki_restaurantes owner tuki_restaurantes;

create role tuki_pedidos login password 'tuki_pedidos_dev';
create database tuki_pedidos owner tuki_pedidos;

create role tuki_resenas login password 'tuki_resenas_dev';
create database tuki_resenas owner tuki_resenas;

create role tuki_media login password 'tuki_media_dev';
create database tuki_media owner tuki_media;

-- El rol tuki_admin lo crea la propia imagen (POSTGRES_USER), así que aquí
-- solo se le asigna su base lógica.
create database tuki_admin owner tuki_admin;
