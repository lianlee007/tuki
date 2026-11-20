-- Clasificación dietética y alérgenos de los platos demo.
--
-- El catálogo importado desde la versión anterior no traía estas banderas.
-- Sin ellas el chatbot no puede responder "algo vegetariano" o "sin gluten",
-- que es justamente una de las consultas más útiles. Se aplica después de
-- restaurantes-demo.sql y es idempotente.

-- Vegetarianos con lácteos o huevo.
with vegetarianos(restaurante_slug, plato) as (
  values
    ('cafe-bolivar', 'Brownie con helado'),
    ('cafe-bolivar', 'Capuchino'),
    ('cafe-bolivar', 'Cheesecake de mora'),
    ('cafe-bolivar', 'Obleas con arequipe'),
    ('cafe-bolivar', 'Torta de chocolate'),
    ('cafe-bolivar', 'Torta de fresa'),
    ('cafe-bolivar', 'Waffle con frutos rojos'),
    ('pizzeria-centenario', 'Pizza margarita'),
    ('pizzeria-centenario', 'Pizza napolitana'),
    ('fritanga-el-fogon', 'Arepa de choclo'),
    ('sabor-payanes', 'Envueltos de choclo'),
    ('sabor-payanes', 'Mazamorra payanesa'),
    ('donde-lian', 'Envueltos de choclo'),
    ('donde-lian', 'Mazamorra'),
    ('donde-lian', 'Obleas'),
    ('donde-lian', 'Torta de fresa')
)
update platillos p
set vegetariano = true
from restaurantes r, vegetarianos v
where p.restaurante_id = r.id
  and r.slug = v.restaurante_slug
  and p.nombre = v.plato;

-- Veganos: no llevan carne, leche ni huevo.
with veganos(restaurante_slug, plato) as (
  values
    ('cafe-bolivar', 'Café de la finca'),
    ('asadero-los-arcos', 'Patacones'),
    ('fritanga-el-fogon', 'Patacones con hogao'),
    ('fritanga-el-fogon', 'Salpicón de frutas')
)
update platillos p
set vegetariano = true, vegano = true
from restaurantes r, veganos v
where p.restaurante_id = r.id
  and r.slug = v.restaurante_slug
  and p.nombre = v.plato;

-- Alérgenos declarados para los platos que los contienen de forma evidente.
with con_alergenos(restaurante_slug, plato, alergeno) as (
  values
    ('cafe-bolivar', 'Brownie con helado', 'gluten'),
    ('cafe-bolivar', 'Brownie con helado', 'lactosa'),
    ('cafe-bolivar', 'Brownie con helado', 'huevo'),
    ('cafe-bolivar', 'Cheesecake de mora', 'gluten'),
    ('cafe-bolivar', 'Cheesecake de mora', 'lactosa'),
    ('cafe-bolivar', 'Cheesecake de mora', 'huevo'),
    ('cafe-bolivar', 'Obleas con arequipe', 'lactosa'),
    ('cafe-bolivar', 'Torta de chocolate', 'gluten'),
    ('cafe-bolivar', 'Torta de chocolate', 'lactosa'),
    ('cafe-bolivar', 'Torta de chocolate', 'huevo'),
    ('cafe-bolivar', 'Torta de fresa', 'gluten'),
    ('cafe-bolivar', 'Torta de fresa', 'lactosa'),
    ('cafe-bolivar', 'Torta de fresa', 'huevo'),
    ('cafe-bolivar', 'Waffle con frutos rojos', 'gluten'),
    ('cafe-bolivar', 'Waffle con frutos rojos', 'lactosa'),
    ('cafe-bolivar', 'Waffle con frutos rojos', 'huevo'),
    ('pizzeria-centenario', 'Pizza margarita', 'gluten'),
    ('pizzeria-centenario', 'Pizza margarita', 'lactosa'),
    ('pizzeria-centenario', 'Pizza napolitana', 'gluten'),
    ('pizzeria-centenario', 'Pizza napolitana', 'lactosa'),
    ('pizzeria-centenario', 'Pizza de pepperoni', 'gluten'),
    ('pizzeria-centenario', 'Pizza de pepperoni', 'lactosa'),
    ('pizzeria-centenario', 'Espagueti con albóndiga', 'gluten'),
    ('pizzeria-centenario', 'Lasagna boloñesa', 'gluten'),
    ('pizzeria-centenario', 'Lasagna boloñesa', 'lactosa'),
    ('pizzeria-centenario', 'Lasagna de la casa', 'gluten'),
    ('pizzeria-centenario', 'Lasagna de la casa', 'lactosa'),
    ('pizzeria-centenario', 'Pastas carbonara', 'gluten'),
    ('pizzeria-centenario', 'Pastas carbonara', 'lactosa'),
    ('pizzeria-centenario', 'Pastas carbonara', 'huevo'),
    ('fritanga-el-fogon', 'Arepa de choclo', 'lactosa')
),
agrupados as (
  select restaurante_slug, plato, array_agg(alergeno) as nuevos
  from con_alergenos
  group by restaurante_slug, plato
)
update platillos p
set alergenos = (
  select array_agg(distinct item)
  from unnest(p.alergenos || a.nuevos) as item
)
from restaurantes r, agrupados a
where p.restaurante_id = r.id
  and r.slug = a.restaurante_slug
  and p.nombre = a.plato;
