-- ============================================================================
--  Riki · Cinco restaurantes de ejemplo en Popayán
--  ---------------------------------------------------------------------------
--  QUÉ HACE
--  Crea cinco restaurantes completos —cuenta, restaurante, tema y carta— para
--  que la prueba social de la página de inicio tenga de dónde tirar. Todos son
--  de Popayán (Cauca) y cada uno usa una plantilla distinta, para que se vea el
--  abanico de estilos: carta, moderno, grid, minimalista y mosaico.
--
--  CÓMO SE USA
--  Copia todo el archivo y pégalo en el SQL Editor de Supabase, y pulsa Run.
--  Es idempotente: puedes ejecutarlo las veces que quieras. Actualiza lo que ya
--  existe y reemplaza las cartas en lugar de duplicarlas.
--
--  AVISO: la contraseña de estas cuentas de ejemplo es de laboratorio. Cámbiala
--  o elimina los datos antes de usar el proyecto en un entorno accesible.
--
--  Ya está aplicado en el proyecto. Mientras no lo borres, volver a ejecutarlo
--  no cambia nada; si editas un dato aquí y lo corres otra vez, se actualiza.
--
--  Al final hay una consulta de comprobación y, comentado, el bloque para
--  deshacerlo todo cuando termines de mostrar la demo.
--
--  LAS FOTOS
--  Las de los platos son las que ya están subidas a la cuenta de Cloudinary del
--  proyecto (las del menú de Donde Lian), así que no dependen de servicios
--  externos. Las cinco portadas son de Wikimedia Commons, con licencia libre:
--  si quieres, súbelas a Cloudinary y cambia las URLs.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- PASO 1 · Las cinco cuentas dueñas
-- ---------------------------------------------------------------------------
-- Cada restaurante necesita su propio usuario: `restaurantes.usuario_id` es
-- único, un local por cuenta.
--
-- La contraseña de las cinco es la misma, para que puedas entrar al panel de
-- cualquiera y ver cómo queda por dentro:  Riki2026*
-- Cámbiala —o borra las cuentas— cuando termines de mostrar la demo.
--
-- Si tu proyecto no te deja escribir en el esquema `auth`, crea las cinco
-- cuentas a mano desde /auth?mode=register con estos mismos correos: el paso 2
-- las busca por correo y hace el resto igual.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  extensions.crypt('Riki2026*', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('nombre', u.nombre, 'apellido', u.apellido),
  now(), now(), '', '', '', ''
from (values
  ('a1000001-0000-4000-8000-000000000001'::uuid, 'sabor.payanes@riki.app',     'Ana Lucía', 'Payán'),
  ('a1000002-0000-4000-8000-000000000002'::uuid, 'asadero.arcos@riki.app',     'Julián',    'Arcos'),
  ('a1000003-0000-4000-8000-000000000003'::uuid, 'pizzeria.centenario@riki.app','Camila',   'Muñoz'),
  ('a1000004-0000-4000-8000-000000000004'::uuid, 'cafe.bolivar@riki.app',      'Andrés',    'Bolívar'),
  ('a1000005-0000-4000-8000-000000000005'::uuid, 'fritanga.fogon@riki.app',    'Rosa',      'Chamorro')
) as u(id, email, nombre, apellido)
on conflict (id) do nothing;

-- La identidad es lo que permite entrar con correo y contraseña.
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email),
       'email', now(), now(), now()
from (values
  ('a1000001-0000-4000-8000-000000000001'::uuid, 'sabor.payanes@riki.app'),
  ('a1000002-0000-4000-8000-000000000002'::uuid, 'asadero.arcos@riki.app'),
  ('a1000003-0000-4000-8000-000000000003'::uuid, 'pizzeria.centenario@riki.app'),
  ('a1000004-0000-4000-8000-000000000004'::uuid, 'cafe.bolivar@riki.app'),
  ('a1000005-0000-4000-8000-000000000005'::uuid, 'fritanga.fogon@riki.app')
) as u(id, email)
where exists (select 1 from auth.users a where a.id = u.id)
  and not exists (
    select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
  );

-- El perfil público de cada cuenta. Si tu proyecto ya tiene un disparador que
-- lo crea al registrarse, este insert no hace nada.
insert into public.users (id, email, nombre, apellido)
select u.id, u.email, u.nombre, u.apellido
from (values
  ('a1000001-0000-4000-8000-000000000001'::uuid, 'sabor.payanes@riki.app',     'Ana Lucía', 'Payán'),
  ('a1000002-0000-4000-8000-000000000002'::uuid, 'asadero.arcos@riki.app',     'Julián',    'Arcos'),
  ('a1000003-0000-4000-8000-000000000003'::uuid, 'pizzeria.centenario@riki.app','Camila',   'Muñoz'),
  ('a1000004-0000-4000-8000-000000000004'::uuid, 'cafe.bolivar@riki.app',      'Andrés',    'Bolívar'),
  ('a1000005-0000-4000-8000-000000000005'::uuid, 'fritanga.fogon@riki.app',    'Rosa',      'Chamorro')
) as u(id, email, nombre, apellido)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- PASO 2 · Los restaurantes
-- ---------------------------------------------------------------------------
-- `activo` en true para que se vean sin iniciar sesión, y `municipio` en
-- Popayán para que la tarjeta de la página de inicio muestre la ciudad.

insert into public.restaurantes (
  usuario_id, nombre, eslogan, descripcion, direccion, ciudad, municipio,
  departamento, pais, telefono, whatsapp, email, horario_apertura, horario_cierre,
  dias_abierto, moneda, idioma, imagen_banner_url, activo
)
select
  u.id, d.nombre, d.eslogan, d.descripcion, d.direccion, 'Popayán', 'Popayán',
  'Cauca', 'Colombia', d.telefono, d.telefono, u.email, '11:00'::time, d.cierre::time,
  '{"lunes":true,"martes":true,"miercoles":true,"jueves":true,"viernes":true,"sabado":true,"domingo":true}'::jsonb,
  'COP', 'es', d.banner, true
from (values
  ('sabor.payanes@riki.app', 'Sabor Payanés', 'La cocina de siempre, hecha hoy',
   'Pipián, tamales y sopas de la región, con producto del mercado de Popayán y recetas de familia.',
   'Calle 5 # 8-21, Centro Histórico', '+57 300 000 0001', '21:30',
   'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/Bandeja_paisa_30062011.jpg/1280px-Bandeja_paisa_30062011.jpg'),

  ('asadero.arcos@riki.app', 'Asadero Los Arcos', 'Carne a la brasa, sin afán',
   'Cortes madurados y leña de eucalipto, con guarniciones de la casa.',
   'Carrera 9 # 4-45, El Empedrado', '+57 300 000 0002', '22:30',
   'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Meat_roasting_at_Carnivore_restaurant_in_Nairobi.jpg/1280px-Meat_roasting_at_Carnivore_restaurant_in_Nairobi.jpg'),

  ('pizzeria.centenario@riki.app', 'Pizzería Centenario', 'Masa madre, horno de piedra',
   'Pizzas de fermentación lenta y pastas frescas, a dos cuadras del Parque Caldas.',
   'Calle 3 # 6-40, Centro Histórico', '+57 300 000 0003', '22:00',
   'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Cafe_Deco_Pizzeria_Interior_Photo.jpg/1280px-Cafe_Deco_Pizzeria_Interior_Photo.jpg'),

  ('cafe.bolivar@riki.app', 'Café Bolívar', 'Café del Cauca y repostería de la casa',
   'Tinto de fincas caucanas, tortas horneadas en el día y mesas para quedarse un rato.',
   'Calle 4 # 5-18, frente al Parque Caldas', '+57 300 000 0004', '20:00',
   'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Guelaguetza_Restaurante_-_February_2024_-_Sarah_Stierch_01.jpg/1280px-Guelaguetza_Restaurante_-_February_2024_-_Sarah_Stierch_01.jpg'),

  ('fritanga.fogon@riki.app', 'Fritanga El Fogón', 'Antojos, sopas y lo que se antoje',
   'Fritanga de la esquina con sopas del día, hamburguesas y postres de frutas.',
   'Carrera 6 # 12-30, barrio Bolívar', '+57 300 000 0005', '21:00',
   'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Starmugs_Cafe_interior_on_Lordship_Lane_Tottenham_London_England_02.jpg/1280px-Starmugs_Cafe_interior_on_Lordship_Lane_Tottenham_London_England_02.jpg')
) as d(email, nombre, eslogan, descripcion, direccion, telefono, cierre, banner)
join public.users u on u.email = d.email
on conflict (usuario_id) do update set
  nombre            = excluded.nombre,
  eslogan           = excluded.eslogan,
  descripcion       = excluded.descripcion,
  direccion         = excluded.direccion,
  ciudad            = excluded.ciudad,
  municipio         = excluded.municipio,
  departamento      = excluded.departamento,
  pais              = excluded.pais,
  telefono          = excluded.telefono,
  whatsapp          = excluded.whatsapp,
  email             = excluded.email,
  horario_apertura  = excluded.horario_apertura,
  horario_cierre    = excluded.horario_cierre,
  dias_abierto      = excluded.dias_abierto,
  moneda            = excluded.moneda,
  idioma            = excluded.idioma,
  imagen_banner_url = excluded.imagen_banner_url,
  activo            = true,
  updated_at        = now();

-- ---------------------------------------------------------------------------
-- PASO 3 · El tema de cada uno
-- ---------------------------------------------------------------------------
-- Los colores oscuros se dejan en nulo a propósito: así cada restaurante
-- deriva su modo oscuro de su propio color de marca, que es lo que hace la
-- aplicación, y no de un tono fijo que a unos les queda bien y a otros no.

insert into public.temas (
  restaurante_id, estilo_plantilla, fuente_titulos, fuente_cuerpo,
  color_primario, color_secundario, color_fondo, color_texto, color_texto_titulos
)
select
  r.id, t.plantilla, t.fuente_titulos, 'Inter',
  t.primario, t.secundario, t.fondo, t.texto, t.titulos
from (values
  ('sabor.payanes@riki.app',      'carta',       'Playfair Display', '#8C2F1E', '#C2703B', '#FBF7F0', '#2B211A', '#4A2C1A'),
  ('asadero.arcos@riki.app',      'moderno',     'Inter',            '#E25822', '#8A6B2F', '#141110', '#EFE7DE', '#FFFFFF'),
  ('pizzeria.centenario@riki.app','grid',        'Inter',            '#1F7A3D', '#C0392B', '#FFFDF7', '#23201B', '#12321E'),
  ('cafe.bolivar@riki.app',       'minimalista', 'Playfair Display', '#5B3A21', '#A8743F', '#FAF6F1', '#2A241F', '#3B2314'),
  ('fritanga.fogon@riki.app',     'mosaico',     'Inter',            '#D97706', '#E11D48', '#FFFBF3', '#291F14', '#5B3A0B')
) as t(email, plantilla, fuente_titulos, primario, secundario, fondo, texto, titulos)
join public.users u on u.email = t.email
join public.restaurantes r on r.usuario_id = u.id
on conflict (restaurante_id) do update set
  estilo_plantilla        = excluded.estilo_plantilla,
  fuente_titulos          = excluded.fuente_titulos,
  fuente_cuerpo           = excluded.fuente_cuerpo,
  color_primario          = excluded.color_primario,
  color_secundario        = excluded.color_secundario,
  color_fondo             = excluded.color_fondo,
  color_texto             = excluded.color_texto,
  color_texto_titulos     = excluded.color_texto_titulos,
  updated_at              = now();

-- ---------------------------------------------------------------------------
-- PASO 4 · Las cartas
-- ---------------------------------------------------------------------------
-- Primero se borran las cartas de estos cinco, para que volver a ejecutar el
-- script reemplace los platos en vez de duplicarlos.

delete from public.platillos
where restaurante_id in (
  select r.id
  from public.restaurantes r
  join public.users u on u.id = r.usuario_id
  where u.email in (
    'sabor.payanes@riki.app', 'asadero.arcos@riki.app', 'pizzeria.centenario@riki.app',
    'cafe.bolivar@riki.app', 'fritanga.fogon@riki.app'
  )
);

insert into public.platillos (
  restaurante_id, nombre, descripcion, precio, categoria, imagen_url,
  orden, activo, disponible, destacado
)
select
  r.id, v.nombre, v.descripcion, v.precio, v.categoria, f.url,
  v.orden, true, true, v.destacado
from (values
  -- Sabor Payanés
  ('sabor.payanes@riki.app', 'Bandeja paisa', 'Fríjoles, arroz, carne en polvo, chicharrón, huevo, arepa y aguacate.', 28000, 'Típica', 'bandeja', 1, true),
  ('sabor.payanes@riki.app', 'Ajiaco santafereño', 'Pollo, tres clases de papa, mazorca y guasca, con crema y alcaparras.', 24000, 'Sopas', 'ajiaco', 2, false),
  ('sabor.payanes@riki.app', 'Sancocho de gallina', 'Gallina criolla, yuca, plátano y mazorca, a fuego lento.', 22000, 'Sopas', 'sancocho', 3, false),
  ('sabor.payanes@riki.app', 'Tamal huilense', 'Masa de maíz con pollo, cerdo y arroz, envuelta en hoja de plátano.', 15000, 'Típica', 'tamal', 4, false),
  ('sabor.payanes@riki.app', 'Empanadas de pipián', 'Seis empanadas de papa con pipián de maní, como en el mercado.', 12000, 'Entradas', 'empanadas', 5, false),
  ('sabor.payanes@riki.app', 'Arepa rellena', 'Arepa asada con carne desmechada y queso campesino.', 10000, 'Entradas', 'arepaRellena', 6, false),
  ('sabor.payanes@riki.app', 'Mazamorra payanesa', 'Maíz blanco con panela, leche y canela.', 9000, 'Postres', 'mazamorra', 7, false),
  ('sabor.payanes@riki.app', 'Envueltos de choclo', 'Dulce de maíz tierno envuelto en su propia hoja.', 8000, 'Postres', 'envueltos', 8, false),

  -- Asadero Los Arcos
  ('asadero.arcos@riki.app', 'Churrasco', 'Lomo de res a la brasa con papas a la francesa y chimichurri de la casa.', 38000, 'Carnes', 'churrasco', 1, true),
  ('asadero.arcos@riki.app', 'Picada de carnes', 'Res, cerdo, morcilla, chorizo, papa criolla y plátano, para dos o tres.', 45000, 'Para compartir', 'picada', 2, true),
  ('asadero.arcos@riki.app', 'Asado huilense', 'Cerdo marinado en cerveza y especias, asado lentamente.', 32000, 'Carnes', 'asadoHuilense', 3, false),
  ('asadero.arcos@riki.app', 'Punta de anca', 'Corte a la parrilla en su punto, con ensalada de la casa.', 36000, 'Carnes', 'asadoA', 4, false),
  ('asadero.arcos@riki.app', 'Parrillada para dos', 'Selección de cortes, chorizo, costilla de cerdo y guarniciones.', 62000, 'Para compartir', 'parrillada', 5, false),
  ('asadero.arcos@riki.app', 'Chuleta a la brasa', 'Chuleta de cerdo con sal gruesa y leña de eucalipto.', 34000, 'Carnes', 'churrascoCampeiro', 6, false),
  ('asadero.arcos@riki.app', 'Morcilla', 'Morcilla artesanal con arepa asada y limón.', 12000, 'Entradas', 'morcilla', 7, false),
  ('asadero.arcos@riki.app', 'Patacones', 'Plátano verde prensado y frito, con hogao.', 8000, 'Entradas', 'patacones', 8, false),

  -- Pizzería Centenario
  ('pizzeria.centenario@riki.app', 'Pizza de pepperoni', 'Salsa de tomate, mozzarella y pepperoni. Mediana de 8 porciones.', 34000, 'Pizzas', 'pizzaPeperoni', 1, true),
  ('pizzeria.centenario@riki.app', 'Pizza napolitana', 'Masa de fermentación lenta, horneada en piedra.', 30000, 'Pizzas', 'pizzaNapolitana', 2, false),
  ('pizzeria.centenario@riki.app', 'Pizza margarita', 'Tomate, mozzarella fresca y albahaca.', 28000, 'Pizzas', 'pizzaMargarita', 3, false),
  ('pizzeria.centenario@riki.app', 'Lasagna boloñesa', 'Receta boloñesa clásica, con parmesano.', 32000, 'Pastas', 'lasanaCarne', 4, false),
  ('pizzeria.centenario@riki.app', 'Lasagna de la casa', 'Capas de pasta, carne y bechamel, gratinadas.', 30000, 'Pastas', 'lasana', 5, false),
  ('pizzeria.centenario@riki.app', 'Espagueti con albóndiga', 'Albóndigas de res en salsa de tomate, sobre espagueti.', 28000, 'Pastas', 'espagueti', 6, false),
  ('pizzeria.centenario@riki.app', 'Pastas carbonara', 'Pasta fresca con tocineta, huevo, parmesano y pimienta.', 26000, 'Pastas', 'carbonara', 7, false),
  ('pizzeria.centenario@riki.app', 'Ensalada césar', 'Lechuga romana, pollo a la plancha, parmesano y aderezo césar.', 18000, 'Entradas', 'cesar', 8, false),

  -- Café Bolívar
  ('cafe.bolivar@riki.app', 'Capuchino', 'Espresso doble con leche vaporizada y espuma densa.', 7500, 'Café', 'capuchino', 1, true),
  ('cafe.bolivar@riki.app', 'Waffle con frutos rojos', 'Waffle recién hecho con frutos rojos y miel.', 14000, 'Repostería', 'waffle', 2, false),
  ('cafe.bolivar@riki.app', 'Brownie con helado', 'Brownie de chocolate tibio con helado de vainilla.', 12000, 'Repostería', 'brownie', 3, false),
  ('cafe.bolivar@riki.app', 'Cheesecake de mora', 'Cheesecake horneado con salsa de mora del Cauca.', 11000, 'Repostería', 'cheesecake', 4, false),
  ('cafe.bolivar@riki.app', 'Torta de chocolate', 'Chocolate 70 %, húmeda y con cobertura de cacao.', 9500, 'Repostería', 'tortaChocolate', 5, false),
  ('cafe.bolivar@riki.app', 'Torta de fresa', 'Bizcocho de vainilla con fresas frescas y crema chantilly.', 9000, 'Repostería', 'tortaFresa', 6, false),
  ('cafe.bolivar@riki.app', 'Obleas con arequipe', 'Obleas crujientes con arequipe y queso rallado.', 6000, 'Antojos', 'obleas', 7, false),
  ('cafe.bolivar@riki.app', 'Café de la finca', 'Tinto del día, de fincas del Cauca, preparado en cafetera de goteo.', 5500, 'Café', 'cafe', 8, false),

  -- Fritanga El Fogón
  ('fritanga.fogon@riki.app', 'Hamburguesa de la casa', 'Dos carnes de res, queso, lechuga, tomate y papas.', 18000, 'Comidas rápidas', 'hamburguesa', 1, true),
  ('fritanga.fogon@riki.app', 'Mojarra frita', 'Mojarra entera frita, con patacón, arroz y ensalada.', 26000, 'Pescados', 'mojarra', 2, false),
  ('fritanga.fogon@riki.app', 'Caldo de res', 'Cocido con papa, zanahoria, mazorca, yuca y cilantro.', 18000, 'Sopas', 'caldoRes', 3, false),
  ('fritanga.fogon@riki.app', 'Sopa de maíz', 'Crema de maíz tierno con queso y mantequilla.', 16000, 'Sopas', 'sopaMaiz', 4, false),
  ('fritanga.fogon@riki.app', 'Salpicón de frutas', 'Frutas de la región en jugo de naranja, con helado.', 10000, 'Postres', 'salpicon', 5, false),
  ('fritanga.fogon@riki.app', 'Patacones con hogao', 'Plátano verde frito con hogao payanés.', 9000, 'Entradas', 'platanoFrito', 6, false),
  ('fritanga.fogon@riki.app', 'Arepa de choclo', 'Arepa dulce de maíz tierno con queso.', 7000, 'Antojos', 'arepaChoclo', 7, false)
) as v(email, nombre, descripcion, precio, categoria, foto, orden, destacado)
join public.users u on u.email = v.email
join public.restaurantes r on r.usuario_id = u.id
join (values
  ('bandeja',       'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763963623/npbo3nw2x1t2z2rgtfcy.jpg'),
  ('ajiaco',        'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763963684/lua6hscnpvo3yppsa0mg.jpg'),
  ('sancocho',      'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763964302/cazuj83gvrzcghzzd1o6.jpg'),
  ('tamal',         'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763964454/r6fam5juk7zzzx3ozqqr.jpg'),
  ('empanadas',     'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763963507/k7dwvck9j5n6x2qs3rxe.jpg'),
  ('arepaRellena',  'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763963581/pcagfgevwyc7m9h28nar.jpg'),
  ('mazamorra',     'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763963453/jdzw3ypjwobbaghfxmw9.jpg'),
  ('envueltos',     'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763964096/avvoc6aete6in6ddghwc.jpg'),

  ('churrasco',     'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763963658/z4uw0kpqv78sqyutfije.jpg'),
  ('picada',        'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763964402/vnpbcx2zhgbrlr5vxrfo.jpg'),
  ('asadoHuilense', 'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763964220/bywmwavrkw5yfh7k7lhu.jpg'),
  ('asadoA',        'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/Asado_a.jpg/1280px-Asado_a.jpg'),
  ('parrillada',    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Plato_de_parrillada_argentina_con_costilla_de_carne%2C_chorizo%2C_costilla_de_cerdo_y_guarniciones.jpg/1280px-Plato_de_parrillada_argentina_con_costilla_de_carne%2C_chorizo%2C_costilla_de_cerdo_y_guarniciones.jpg'),
  ('churrascoCampeiro','https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Churrasco_Campeiro.jpg/1280px-Churrasco_Campeiro.jpg'),
  ('patacones',     'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/Patacones.JPG/1280px-Patacones.JPG'),
  ('morcilla',      'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763964480/swvwz8kiefzwyxg0xkzg.jpg'),

  ('pizzaPeperoni', 'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763963910/tjgkp41bzujgn9p0e6yh.jpg'),
  ('pizzaNapolitana','https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Punch_Neapolitan_Pizza_%282257030480%29.jpg/1280px-Punch_Neapolitan_Pizza_%282257030480%29.jpg'),
  ('pizzaMargarita','https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f0/Pizza_Margarita.jpg/1280px-Pizza_Margarita.jpg'),
  ('lasanaCarne',   'https://upload.wikimedia.org/wikipedia/commons/0/06/Meaty_Lasagna_8of8_%288736299782%29.jpg'),
  ('lasana',        'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/Lasagna_-3_Lasagna_%28936739921%29.jpg/1280px-Lasagna_-3_Lasagna_%28936739921%29.jpg'),
  ('espagueti',     'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763963821/qtrsij08zjbqnbyae0kw.jpg'),
  ('carbonara',     'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763963733/dixqthvsbhdcxdunefqk.jpg'),
  ('cesar',         'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Caesar_salad_%282%29.jpg/1280px-Caesar_salad_%282%29.jpg'),

  ('capuchino',     'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Classical_Cappuccino_in_Savour_Cafe.jpg/1280px-Classical_Cappuccino_in_Savour_Cafe.jpg'),
  ('waffle',        'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Waffle%2C_Baytree_Waffle_House%2C_Remerton.jpg/1280px-Waffle%2C_Baytree_Waffle_House%2C_Remerton.jpg'),
  ('brownie',       'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Brownie_Crust.jpg/1280px-Brownie_Crust.jpg'),
  ('cheesecake',    'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/59/Souffl%C3%A9-style_cheesecake_001.jpg/1280px-Souffl%C3%A9-style_cheesecake_001.jpg'),
  ('tortaChocolate','https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/Piece_of_chocolate_cake_on_a_white_plate_decorated_with_chocolate_sauce.jpg/1280px-Piece_of_chocolate_cake_on_a_white_plate_decorated_with_chocolate_sauce.jpg'),
  ('tortaFresa',    'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763963879/lpf1yesdfizrnvh7yce8.jpg'),
  ('obleas',        'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763964499/abjlmptq8wxhhciwccy5.jpg'),
  ('cafe',          'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/1280px-A_small_cup_of_coffee.JPG'),

  ('hamburguesa',   'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763963323/ej7zsy7biucwkj49o2yp.jpg'),
  ('mojarra',       'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763963335/qqr2skfopav2bwpi0k5q.jpg'),
  ('caldoRes',      'https://res.cloudinary.com/devkryifc/image/upload/q_auto,f_auto/v1763964163/y4jmghppfcdthd7hrxpq.jpg'),
  ('sopaMaiz',      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Corn_crab_soup1.jpg/1280px-Corn_crab_soup1.jpg'),
  ('salpicon',      'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/Sirviendo_salpic%C3%B3n_de_frutas.jpg/1280px-Sirviendo_salpic%C3%B3n_de_frutas.jpg'),
  ('platanoFrito',  'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Fryingplantains10-28-06b.jpg/1280px-Fryingplantains10-28-06b.jpg'),
  ('arepaChoclo',   'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Arepa_de_chocolo.jpg/1280px-Arepa_de_chocolo.jpg')
) as f(clave, url) on f.clave = v.foto;

commit;

-- ---------------------------------------------------------------------------
-- COMPROBACIÓN · Debería listar cinco filas con 7 u 8 platos cada una
-- ---------------------------------------------------------------------------
select
  r.nombre,
  r.municipio || ', ' || r.departamento as ubicacion,
  t.estilo_plantilla as plantilla,
  count(p.id) as platos,
  '/' || replace(lower(r.nombre), ' ', '-') as enlace_aproximado
from public.restaurantes r
join public.users u on u.id = r.usuario_id
left join public.temas t on t.restaurante_id = r.id
left join public.platillos p on p.restaurante_id = r.id
where u.email in (
  'sabor.payanes@riki.app', 'asadero.arcos@riki.app', 'pizzeria.centenario@riki.app',
  'cafe.bolivar@riki.app', 'fritanga.fogon@riki.app'
)
group by r.nombre, r.municipio, r.departamento, t.estilo_plantilla
order by r.nombre;

-- ============================================================================
--  PARA DESHACERLO
--  Descomenta este bloque y ejecútalo cuando termines de mostrar la demo.
-- ============================================================================
-- begin;
--
-- delete from public.platillos
-- where restaurante_id in (
--   select r.id from public.restaurantes r
--   join public.users u on u.id = r.usuario_id
--   where u.email like '%@riki.app'
-- );
--
-- delete from public.temas
-- where restaurante_id in (
--   select r.id from public.restaurantes r
--   join public.users u on u.id = r.usuario_id
--   where u.email like '%@riki.app'
-- );
--
-- delete from public.restaurantes
-- where usuario_id in (select id from public.users where email like '%@riki.app');
--
-- delete from public.users where email like '%@riki.app';
--
-- delete from auth.identities
-- where user_id in (select id from auth.users where email like '%@riki.app');
--
-- delete from auth.users where email like '%@riki.app';
--
-- commit;
