-- Restaurantes, temas, categorías y platos demo.
-- Aplicar sobre tuki_restaurantes después de las migraciones y de
-- identidad-demo.sql. Los dueños usan los UUID de ese archivo.

insert into restaurantes (
  id, dueno_id, slug, nombre, descripcion, eslogan, telefono, whatsapp,
  ciudad, direccion, horario_apertura, horario_cierre
) values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'cafe-bolivar',
    'Café Bolívar',
    'Café de especialidad y repostería en el centro de Popayán.',
    'El mejor café de la ciudad',
    '3001234567',
    '3001234567',
    'Popayán',
    'Calle 5 # 4-21',
    '08:00',
    '20:00'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'pizzeria-centenario',
    'Pizzería Centenario',
    'Pizza artesanal al horno de leña.',
    'Masa madre, fuego real',
    '3007654321',
    '3007654321',
    'Popayán',
    'Carrera 9 # 12-40',
    '12:00',
    '22:00'
  )
on conflict (id) do nothing;

insert into temas (restaurante_id) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
on conflict (restaurante_id) do nothing;

insert into categorias (id, restaurante_id, nombre, icono, orden) values
  (
    'c1111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Cafés',
    'coffee',
    1
  ),
  (
    'c1111111-1111-4111-8111-111111111112',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Postres',
    'dessert',
    2
  ),
  (
    'c2222222-2222-4222-8222-222222222221',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Pizzas',
    'pizza',
    1
  ),
  (
    'c2222222-2222-4222-8222-222222222222',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Bebidas',
    'drink',
    2
  )
on conflict (id) do nothing;

insert into platillos (
  id, restaurante_id, categoria_id, nombre, descripcion, precio,
  vegetariano, vegano, picante, orden
) values
  (
    'd1111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'c1111111-1111-4111-8111-111111111111',
    'Capuchino de la casa',
    'Espresso doble, leche vaporizada y cacao.',
    8500,
    true,
    false,
    false,
    1
  ),
  (
    'd1111111-1111-4111-8111-111111111112',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'c1111111-1111-4111-8111-111111111112',
    'Torta de zanahoria',
    'Porción con frosting de queso crema.',
    7200,
    true,
    false,
    false,
    2
  ),
  (
    'd2222222-2222-4222-8222-222222222221',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'c2222222-2222-4222-8222-222222222221',
    'Pizza margarita',
    'Salsa de tomate, mozzarella y albahaca.',
    28000,
    true,
    false,
    false,
    1
  ),
  (
    'd2222222-2222-4222-8222-222222222222',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'c2222222-2222-4222-8222-222222222222',
    'Limonada de coco',
    'Limón, coco y panela.',
    9000,
    true,
    true,
    false,
    2
  )
on conflict (id) do nothing;

insert into restaurantes_cocinas (restaurante_id, tipo_cocina_id, principal)
select r.id, tc.id, true
from restaurantes r
join tipos_cocina tc on tc.slug = 'cafeteria'
where r.slug = 'cafe-bolivar'
on conflict do nothing;

insert into restaurantes_cocinas (restaurante_id, tipo_cocina_id, principal)
select r.id, tc.id, true
from restaurantes r
join tipos_cocina tc on tc.slug = 'pizza'
where r.slug = 'pizzeria-centenario'
on conflict do nothing;
