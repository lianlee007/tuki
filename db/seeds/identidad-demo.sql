-- Cuentas demo. Contraseña para todas: Demo12345
-- Aplicar sobre la base tuki_identidad después de las migraciones.
insert into usuarios (id, email, password_hash, nombre, apellido, rol)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'dueno1@tuki.local',
    '$argon2id$v=19$m=65536,t=3,p=4$cwXk1F9ewaDs1zexBtxYvA$7uJ1ETarVxMMysJQzoE4/B7Cz70Amoi4mik35zUyBi8',
    'Dueño',
    'Café',
    'dueno'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'dueno2@tuki.local',
    '$argon2id$v=19$m=65536,t=3,p=4$cwXk1F9ewaDs1zexBtxYvA$7uJ1ETarVxMMysJQzoE4/B7Cz70Amoi4mik35zUyBi8',
    'Dueño',
    'Pizzería',
    'dueno'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'cliente@tuki.local',
    '$argon2id$v=19$m=65536,t=3,p=4$cwXk1F9ewaDs1zexBtxYvA$7uJ1ETarVxMMysJQzoE4/B7Cz70Amoi4mik35zUyBi8',
    'Cliente',
    'Demo',
    'cliente'
  )
on conflict do nothing;
