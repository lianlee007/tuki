-- Platos extra para la demo del chatbot.
--
-- El catálogo no tenía ninguna opción picante, así que "algo picante" devolvía
-- una lista vacía, y faltaban un par de opciones veganas y para compartir.
-- Los alérgenos van declarados según los ingredientes de cada plato.
-- Idempotente: se puede aplicar varias veces. Va después de
-- restaurantes-demo.sql y restaurantes-dietas.sql.

-- Don Leo no tenía la categoría "Para compartir"; se crea para la tabla.
insert into categorias (restaurante_id, nombre, orden)
select
  r.id,
  'Para compartir',
  coalesce((select max(c.orden) from categorias c where c.restaurante_id = r.id), 0) + 1
from restaurantes r
where r.slug = 'don-leo'
  and not exists (
    select 1 from categorias c
    where c.restaurante_id = r.id and c.nombre = 'Para compartir'
  );

insert into platillos (
  restaurante_id, categoria_id, nombre, descripcion, precio,
  vegetariano, vegano, picante, ingredientes, alergenos, destacado, orden
)
select
  r.id,
  c.id,
  d.nombre,
  d.descripcion,
  d.precio,
  d.vegetariano,
  d.vegano,
  d.picante,
  d.ingredientes,
  d.alergenos,
  d.destacado,
  coalesce((select max(p2.orden) from platillos p2 where p2.restaurante_id = r.id), 0)
    + d.orden
from (values
  (
    'don-leo', 'Platos principales', 'Bowl picante de garbanzo',
    'Bowl de garbanzo con calabaza, ají y arroz basmati, con un picante que despierta.',
    24900, true, true, true,
    array['garbanzo', 'calabaza', 'ají', 'chile', 'arroz basmati', 'cilantro', 'limón']::text[],
    array[]::text[], true, 1
  ),
  (
    'don-leo', 'Para compartir', 'Tabla de la huerta para dos',
    'Tabla para dos con patacones, guacamole, garbanzo y arepas de maíz.',
    39900, true, true, false,
    array['plátano verde', 'aguacate', 'garbanzo', 'tomate', 'arepa de maíz', 'limón', 'cilantro']::text[],
    array[]::text[], true, 2
  ),
  (
    'fritanga-el-fogon', 'Entradas', 'Patacones con ají picante',
    'Patacones crujientes con ají picante de la casa y limón.',
    9500, true, true, true,
    array['plátano verde', 'ají', 'cebolla', 'limón', 'aceite']::text[],
    array[]::text[], false, 1
  ),
  (
    'fritanga-el-fogon', 'Comidas rápidas', 'Chuzo de pollo picante',
    'Chuzo de pollo marinado en ají y chile, con papa a la francesa.',
    16000, false, false, true,
    array['pollo', 'ají', 'chile', 'limón', 'papa', 'cebolla']::text[],
    array[]::text[], false, 2
  ),
  (
    'pizzeria-centenario', 'Pizzas', 'Pizza diavola',
    'Pizza con pepperoni, mozzarella y un toque de ají y chile.',
    36000, false, false, true,
    array['masa de pizza', 'salsa de tomate', 'mozzarella', 'pepperoni', 'ají', 'chile']::text[],
    array['gluten', 'lactosa']::text[], false, 1
  ),
  (
    'sabor-payanes', 'Típica', 'Arepa rellena con ají',
    'Arepa asada rellena de carne desmechada con ají picante y limón.',
    11500, false, false, true,
    array['arepa de maíz', 'carne de res', 'ají', 'cebolla', 'tomate', 'limón']::text[],
    array[]::text[], false, 1
  ),
  (
    'asadero-los-arcos', 'Carnes', 'Costillas BBQ picantes',
    'Costillas de cerdo glaseadas en BBQ con ají y chile, con papa criolla.',
    39000, false, false, true,
    array['costilla de cerdo', 'salsa BBQ', 'ají', 'chile', 'papa criolla']::text[],
    array[]::text[], false, 1
  ),
  (
    'cafe-bolivar', 'Repostería', 'Brownie vegano de cacao',
    'Brownie de cacao sin lácteos ni huevo, con un toque de café.',
    11000, true, true, false,
    array['cacao', 'harina de trigo', 'aceite de coco', 'azúcar', 'café']::text[],
    array['gluten']::text[], false, 1
  ),
  (
    'donde-lian', 'Sopas', 'Sopa de verduras',
    'Sopa de verduras de la huerta con papa, zanahoria y mazorca.',
    14000, true, true, false,
    array['papa', 'zanahoria', 'arveja', 'mazorca', 'cilantro', 'caldo vegetal']::text[],
    array[]::text[], false, 1
  )
) as d(
  restaurante_slug, categoria, nombre, descripcion, precio,
  vegetariano, vegano, picante, ingredientes, alergenos, destacado, orden
)
join restaurantes r on r.slug = d.restaurante_slug
join categorias c on c.restaurante_id = r.id and c.nombre = d.categoria
where not exists (
  select 1
  from platillos p
  where p.restaurante_id = r.id
    and p.nombre = d.nombre
);

-- Platos que ya llevan ají o pipián en su receta: se marcan como picantes para
-- que "algo picante" tenga de dónde escoger.
update platillos p
set picante = true
from restaurantes r
where p.restaurante_id = r.id
  and (r.slug, p.nombre) in (
    ('donde-lian', 'Chorizo con arepa'),
    ('sabor-payanes', 'Empanadas de pipián')
  );
