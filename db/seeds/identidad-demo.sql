-- Cuentas demo. Contraseña para todas: Demo12345
-- Aplicar sobre la base tuki_identidad después de las migraciones.
insert into usuarios (id, email, password_hash, nombre, apellido, rol)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'dueno1@tukituki.local',
    '$argon2id$v=19$m=65536,t=3,p=4$cwXk1F9ewaDs1zexBtxYvA$7uJ1ETarVxMMysJQzoE4/B7Cz70Amoi4mik35zUyBi8',
    'Dueño',
    'Café',
    'dueno'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'dueno2@tukituki.local',
    '$argon2id$v=19$m=65536,t=3,p=4$cwXk1F9ewaDs1zexBtxYvA$7uJ1ETarVxMMysJQzoE4/B7Cz70Amoi4mik35zUyBi8',
    'Dueño',
    'Pizzería',
    'dueno'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'cliente@tukituki.local',
    '$argon2id$v=19$m=65536,t=3,p=4$cwXk1F9ewaDs1zexBtxYvA$7uJ1ETarVxMMysJQzoE4/B7Cz70Amoi4mik35zUyBi8',
    'Cliente',
    'Demo',
    'cliente'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'dueno3@tukituki.local',
    '$argon2id$v=19$m=65536,t=3,p=4$cwXk1F9ewaDs1zexBtxYvA$7uJ1ETarVxMMysJQzoE4/B7Cz70Amoi4mik35zUyBi8',
    'Dueño',
    'Sabor Payanés',
    'dueno'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'dueno4@tukituki.local',
    '$argon2id$v=19$m=65536,t=3,p=4$cwXk1F9ewaDs1zexBtxYvA$7uJ1ETarVxMMysJQzoE4/B7Cz70Amoi4mik35zUyBi8',
    'Dueño',
    'Asadero Los Arcos',
    'dueno'
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    'dueno5@tukituki.local',
    '$argon2id$v=19$m=65536,t=3,p=4$cwXk1F9ewaDs1zexBtxYvA$7uJ1ETarVxMMysJQzoE4/B7Cz70Amoi4mik35zUyBi8',
    'Dueño',
    'Fritanga El Fogón',
    'dueno'
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    'dueno6@tukituki.local',
    '$argon2id$v=19$m=65536,t=3,p=4$cwXk1F9ewaDs1zexBtxYvA$7uJ1ETarVxMMysJQzoE4/B7Cz70Amoi4mik35zUyBi8',
    'Dueño',
    'Donde Lian',
    'dueno'
  ),
  (
    '88888888-8888-4888-8888-888888888888',
    'dueno7@tukituki.local',
    '$argon2id$v=19$m=65536,t=3,p=4$cwXk1F9ewaDs1zexBtxYvA$7uJ1ETarVxMMysJQzoE4/B7Cz70Amoi4mik35zUyBi8',
    'Dueño',
    'Don Leo',
    'dueno'
  )
on conflict do nothing;

-- Migra las cuentas demo creadas antes del renombrado a TukiTuki.
update usuarios
set email = replace(email, '@tuki.local', '@tukituki.local')
where email like '%@tuki.local';
