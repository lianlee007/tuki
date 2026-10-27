-- ============================================================================
--  Riki — Una foto distinta para cada plato
-- ============================================================================
--
--  El seed de Popayán reutilizó la misma clave de imagen para platos de
--  restaurantes distintos: dos hamburguesas con la misma foto, dos mojarras,
--  dos mazamorras… El feed se veía repetido. Este archivo deja 61 platos con
--  61 imágenes distintas y se puede volver a ejecutar sin efectos raros.
--
--  Se empareja por restaurante + nombre del plato (no por UUID) para que
--  funcione también sobre una base recién sembrada. Las fotos nuevas son de
--  Wikimedia Commons, con licencia libre y servidas a 1280 px.
--
--  Verificación al final: `repetidas` debe ser 0.
-- ============================================================================

begin;

update public.platillos p
set imagen_url = v.url
from public.restaurantes r,
     (values
       ('Fritanga El Fogón', 'Hamburguesa de la casa',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Hamburguesa_argentina_casera.jpg/1280px-Hamburguesa_argentina_casera.jpg'),
       ('Fritanga El Fogón', 'Mojarra frita',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/Pan-Fried_Fish_at_Tujaques.jpg/1280px-Pan-Fried_Fish_at_Tujaques.jpg'),
       ('Sabor Payanés', 'Mazamorra payanesa',
        'https://upload.wikimedia.org/wikipedia/commons/a/a5/Mazamorra-antioque%C3%B1a.jpg'),
       ('Donde Lian', 'Empanadas de pollo y carne',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Empanada_colombiana.jpg/1280px-Empanada_colombiana.jpg'),
       ('Sabor Payanés', 'Arepa rellena',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Arepa_de_huevo_por_dentro.jpg/1280px-Arepa_de_huevo_por_dentro.jpg'),
       ('Sabor Payanés', 'Bandeja paisa',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/Bandeja_paisa_30062011.jpg/1280px-Bandeja_paisa_30062011.jpg'),
       ('Donde Lian', 'Churrasco',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4d/Churrasco_de_Torreblanca.jpg/1280px-Churrasco_de_Torreblanca.jpg'),
       ('Sabor Payanés', 'Ajiaco santafereño',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Ajiaco_in_Bogot%C3%A1.jpg/1280px-Ajiaco_in_Bogot%C3%A1.jpg'),
       ('Pizzería Centenario', 'Pastas carbonara',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/22/Pasta_carbonara.jpg/1280px-Pasta_carbonara.jpg'),
       ('Pizzería Centenario', 'Espagueti con albóndiga',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Spaghetti_and_meatballs_1.jpg/1280px-Spaghetti_and_meatballs_1.jpg'),
       ('Donde Lian', 'Torta de fresa',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Strawberry_Cake.JPG/1280px-Strawberry_Cake.JPG'),
       ('Pizzería Centenario', 'Pizza de pepperoni',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e4/Nice_pepperoni_pizza.jpg/1280px-Nice_pepperoni_pizza.jpg'),
       ('Sabor Payanés', 'Envueltos de choclo',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/Bollo_de_mazorca.jpg/1280px-Bollo_de_mazorca.jpg'),
       ('Fritanga El Fogón', 'Caldo de res',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Sopa_de_carne_y_verduras.jpg/1280px-Sopa_de_carne_y_verduras.jpg'),
       ('Donde Lian', 'Asado Huilense',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/Corte_de_asado_de_cerdo_argentino_sobre_tabla_de_madera.jpg/1280px-Corte_de_asado_de_cerdo_argentino_sobre_tabla_de_madera.jpg'),
       ('Sabor Payanés', 'Sancocho de gallina',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/Sancocho_de_gallina_yopal.jpg/1280px-Sancocho_de_gallina_yopal.jpg'),
       ('Donde Lian', 'Picada de carnes',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Fritanga_barranquillera.jpg/1280px-Fritanga_barranquillera.jpg'),
       ('Sabor Payanés', 'Tamal huilense',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Tamal_tolimense_abierto.jpg/1280px-Tamal_tolimense_abierto.jpg'),
       ('Donde Lian', 'Morcilla',
        'https://upload.wikimedia.org/wikipedia/commons/5/5f/Morcilla-burgos_2.jpg'),
       ('Café Bolívar', 'Obleas con arequipe',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Cuchufli.jpg/1280px-Cuchufli.jpg')
     ) as v(restaurante, plato, url)
where p.restaurante_id = r.id
  and r.nombre = v.restaurante
  and btrim(p.nombre) = btrim(v.plato);

commit;

-- Control: 61 platos, 61 imágenes, 0 grupos repetidos.
select
  count(*)::int as platos,
  count(distinct imagen_url)::int as imagenes,
  (select count(*)::int
     from (select imagen_url from public.platillos group by imagen_url having count(*) > 1) d
  ) as repetidas
from public.platillos;
