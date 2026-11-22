-- Reseñas demo con voz de clientes del Cauca y del Huila.
--
-- Aplicar sobre `tuki_resenas` después de que existan los restaurantes:
--   docker exec -i tukituki-postgresdb psql -U tuki_admin -d tuki_resenas \
--     < db/seeds/resenas-demo.sql
--
-- Las reseñas usan UUID fijos para poder reejecutar el archivo sin duplicar
-- (`on conflict do nothing`). Todas son solo texto: `foto_url` queda en null.
--
-- Los UUID de restaurante y platillo corresponden al dataset local actual. Si
-- se re-siembra la base de restaurantes con otros ids, hay que actualizarlos
-- antes de aplicar este archivo.
--
-- La escritura imita a propósito el registro espontáneo de un cliente: minúsculas,
-- tildes omitidas, abreviaturas y alguna falta. No corregir: es el efecto que se
-- busca. Las respuestas del dueño van algo más cuidadas, como en la vida real.

insert into resenas (
  id, restaurante_id, platillo_id, usuario_id, nombre_cliente,
  calificacion, comentario, foto_url, respuesta_dueno, visible, creado_en, actualizado_en
) values
-- ── Asadero Los Arcos ────────────────────────────────────────────────────────
(
  'e1000000-0000-4000-8000-000000000001',
  'ef895a5f-9918-4de2-8b60-1850cba2d441',
  'dbe753be-001e-4e3d-80df-b1041193212a',
  'f1000000-0000-4000-8000-000000000001',
  'Yeison Andrés Muñoz',
  5,
  'vinimos con la familia el domingo y pedimos asado huilense, la porcion es grande y la carne estaba bien cocida. lo unico es q se demoraron como 40 min pero valio la pena. el lugar es sencillo pero limpio',
  null,
  'Muchas gracias Yeison, nos alegra que el asado les haya gustado. Los domingos se nos llena y por eso la espera; ya sumamos una persona más en cocina. ¡Vuelvan pronto!',
  true, '2026-11-16 18:42:00-05', '2026-11-17 09:10:00-05'
),
(
  'e1000000-0000-4000-8000-000000000002',
  'ef895a5f-9918-4de2-8b60-1850cba2d441',
  '527b33a1-c144-45d3-ad78-599753746a98',
  'f1000000-0000-4000-8000-000000000002',
  'leidy johana chaves',
  4,
  'la picada para dos alcanza para tres jajaja, el chicharron estaba super crocante. le falto un poquito de sal al chorizo pero de resto todo rico, volvemos',
  null,
  'Gracias Leidy, tomamos nota de la sal del chorizo. Nos alegra que la picada haya alcanzado para todos. ¡Los esperamos!',
  true, '2026-11-08 13:20:00-05', '2026-11-08 20:05:00-05'
),
(
  'e1000000-0000-4000-8000-000000000003',
  'ef895a5f-9918-4de2-8b60-1850cba2d441',
  '63d9f9bc-e446-4b1a-9101-8d3d5d0e977d',
  'f1000000-0000-4000-8000-000000000003',
  'Deiver Alexánder Tombé',
  2,
  'la verdad no me gusto mucho, la chuleta estaba dura y las papas frias. el muchacho que atiende si es muy amable pero la comida no estuvo como otras veces q he venido',
  null,
  'Deiver, le pedimos disculpas. No es la experiencia que queremos dar. Hablé con el cocinero y le invitamos la próxima chuleta para que nos dé otra oportunidad.',
  true, '2026-10-27 21:12:00-05', '2026-10-28 08:30:00-05'
),
(
  'e1000000-0000-4000-8000-000000000004',
  'ef895a5f-9918-4de2-8b60-1850cba2d441',
  '6e4ef6e8-e2a0-4ece-a182-d252962543e4',
  'f1000000-0000-4000-8000-000000000004',
  'Lina Marcela Palechor',
  5,
  'la morcilla es la mejor q he probado en popayan, no es grasosa y viene con arepa. el precio me parece justo por la cantidad',
  null,
  null,
  true, '2026-10-11 19:05:00-05', '2026-10-11 19:05:00-05'
),
(
  'e1000000-0000-4000-8000-000000000005',
  'ef895a5f-9918-4de2-8b60-1850cba2d441',
  'db00a1a4-65ee-4bc0-9f34-b36c56beed22',
  'f1000000-0000-4000-8000-000000000005',
  'Jhon Fredy Zúñiga',
  4,
  'buen churrasco, la carne en su punto. el sitio es pequeno y toca esperar mesa pero la atencion es rapida y el precio normal',
  null,
  'Gracias Jhon Fredy. El local es pequeño, pero ya estamos mirando cómo ampliar la mesa de afuera. ¡Vuelva pronto!',
  true, '2026-09-19 12:48:00-05', '2026-09-20 10:02:00-05'
),
(
  'e1000000-0000-4000-8000-000000000006',
  'ef895a5f-9918-4de2-8b60-1850cba2d441',
  'abb3d773-3f8c-47b1-94b1-11ccba7ec775',
  'f1000000-0000-4000-8000-000000000006',
  'karen sofia cuellar',
  5,
  'fuimos a celebrar el cumpleanos de mi papa y pedimos la parrillada, quedo para 4 personas. todo muy rico y nos dejaron llevar la torta sin cobrarnos, detalle grande',
  null,
  'Feliz cumpleaños a su papá, Karen. Gracias por celebrarlo con nosotros. ¡La torta siempre es bienvenida!',
  true, '2026-08-30 20:40:00-05', '2026-08-31 09:15:00-05'
),

-- ── Sabor Payanés ────────────────────────────────────────────────────────────
(
  'e1000000-0000-4000-8000-000000000007',
  '601e6660-33fb-4c57-96f8-fa4d2a9cb56b',
  'a56f6953-12e1-45e6-bbff-9094e1b1aba2',
  'f1000000-0000-4000-8000-000000000007',
  'María Fernanda Hoyos',
  5,
  'las empanadas de pipian son otro nivel, la masa queda delgadita y el relleno bien condimentado. se ve q las frien al momento, salen calienticas. el aji de mani tambien muy bueno',
  null,
  'Gracias María Fernanda. Las empanadas se hacen en la mañana; si quiere llevar más, llame y se las tenemos listas.',
  true, '2026-11-18 11:30:00-05', '2026-11-18 15:44:00-05'
),
(
  'e1000000-0000-4000-8000-000000000008',
  '601e6660-33fb-4c57-96f8-fa4d2a9cb56b',
  '5d68ad0a-567e-4c01-8992-233e5ec86794',
  'f1000000-0000-4000-8000-000000000008',
  'Wilmar Andrés Bolaños',
  3,
  'el ajiaco estaba rico pero me parecio poquito para el precio, la porcion no llena. el pan si estaba bueno y la atencion tambien',
  null,
  'Gracias por la sinceridad, Wilmar. Revisamos el tamaño de la porción esta semana. Si vuelve, pida el ajiaco con arepa y le sumamos sin costo.',
  true, '2026-11-02 14:10:00-05', '2026-11-03 09:00:00-05'
),
(
  'e1000000-0000-4000-8000-000000000009',
  '601e6660-33fb-4c57-96f8-fa4d2a9cb56b',
  '6704ebc0-5f41-4a04-8786-371a38e0b2c1',
  'f1000000-0000-4000-8000-000000000009',
  'Heidy Yuliana Losada',
  5,
  'me senti como en la casa de mi abuela en garzon, el sancocho con su presa de gallina y bastante yuca. la señora que atiende muy querida, uno se siente en familia',
  null,
  'Qué alegría leer eso, Heidy. La señora del sancocho es la misma que lleva años en la cocina. ¡La esperamos!',
  true, '2026-10-19 13:05:00-05', '2026-10-19 18:20:00-05'
),
(
  'e1000000-0000-4000-8000-000000000010',
  '601e6660-33fb-4c57-96f8-fa4d2a9cb56b',
  '9e75e75d-2ba3-4a80-8e12-698159762965',
  'f1000000-0000-4000-8000-000000000010',
  'Cristian Camilo Gaviria',
  4,
  'bandeja paisa generosa, el chicharroncito bien. lo unico es q el jugo estaba muy aguado, casi agua con color',
  null,
  'Gracias Cristian. Ese día hubo un problema con la jarra del jugo; ya quedó corregido. La próxima se lo servimos bien cargado.',
  true, '2026-09-27 12:30:00-05', '2026-09-28 08:45:00-05'
),
(
  'e1000000-0000-4000-8000-000000000011',
  '601e6660-33fb-4c57-96f8-fa4d2a9cb56b',
  'c39e0ba7-c5fd-4b19-aa40-6d6ec4fa8934',
  'f1000000-0000-4000-8000-000000000011',
  'angie paola campo',
  5,
  'la mazamorra me trajo recuerdos, dulcecita y caliente. pedi dos y me las comi todas, no me dio pena jajaja',
  null,
  null,
  true, '2026-09-06 17:25:00-05', '2026-09-06 17:25:00-05'
),
(
  'e1000000-0000-4000-8000-000000000012',
  '601e6660-33fb-4c57-96f8-fa4d2a9cb56b',
  'be0004a3-b3cc-4941-bc6e-27513c1bfdd4',
  'f1000000-0000-4000-8000-000000000012',
  'Juan Camilo Polanía',
  4,
  'buen tamal, aunque yo soy del huila y le falto un poquito mas de carne. el envuelto si muy rico y la porcion buena',
  null,
  'Gracias Juan Camilo. Un huilense exigente es la mejor crítica. Le contamos al cocinero lo de la carne.',
  true, '2026-08-17 10:40:00-05', '2026-08-17 16:10:00-05'
),

-- ── Pizzería Centenario ──────────────────────────────────────────────────────
(
  'e1000000-0000-4000-8000-000000000013',
  '4ecc760b-0824-4e0f-a6a7-b673c6250602',
  'b66fd1d3-2703-4334-900e-b7d1328b9db0',
  'f1000000-0000-4000-8000-000000000013',
  'Stefany Dayana Riascos',
  5,
  'la pizza es riquisima, la masa queda suavecita y el queso se estira. nos comimos una grande entre dos. el lugar queda cerca al centro y es facil llegar',
  null,
  'Gracias Stefany. La masa reposa 48 horas, por eso queda suave. ¡Nos alegra que la hayan disfrutado!',
  true, '2026-11-20 20:15:00-05', '2026-11-21 09:30:00-05'
),
(
  'e1000000-0000-4000-8000-000000000014',
  '4ecc760b-0824-4e0f-a6a7-b673c6250602',
  'aa2d8c21-54a5-4af6-9210-0e2bfa3205f6',
  'f1000000-0000-4000-8000-000000000014',
  'Sebastián Andrade',
  4,
  'la lasana estaba buena pero la trajeron tibia, toco pedir q la calentaran. de resto el sabor es casero y la porcion grande',
  null,
  'Le pedimos disculpas, Sebastián. Cambiamos la forma de despachar las lasañas para que salgan bien calientes. Gracias por avisar.',
  true, '2026-11-07 19:50:00-05', '2026-11-08 10:05:00-05'
),
(
  'e1000000-0000-4000-8000-000000000015',
  '4ecc760b-0824-4e0f-a6a7-b673c6250602',
  'c18b9564-01c0-4f16-bd1f-8fc25a8d817b',
  'f1000000-0000-4000-8000-000000000015',
  'Luisa Fernanda Trujillo',
  5,
  'pedimos domicilio y llego caliente, la caja intacta. la margarita con albahaca fresca muy rica. demoraron 45 min pero un sabado normal',
  null,
  'Gracias Luisa. Los sábados el domicilio se demora un poco más; estamos sumando un repartidor. ¡Buen provecho!',
  true, '2026-10-24 21:35:00-05', '2026-10-25 11:20:00-05'
),
(
  'e1000000-0000-4000-8000-000000000016',
  '4ecc760b-0824-4e0f-a6a7-b673c6250602',
  'dc937580-f4ab-453c-a01d-f327222aee96',
  'f1000000-0000-4000-8000-000000000016',
  'Eduar Ferney Cedeño',
  2,
  'la carbonara tenia mucha crema y poco tocineta, no me gusto. el pan de ajo si estaba bueno. esperaba otra cosa por el precio',
  null,
  'Eduar, tiene razón: la carbonara va con más tocineta que crema. Ya ajustamos la receta. Si vuelve, pídala y se la hacemos como debe ser.',
  true, '2026-10-05 18:22:00-05', '2026-10-06 09:40:00-05'
),
(
  'e1000000-0000-4000-8000-000000000017',
  '4ecc760b-0824-4e0f-a6a7-b673c6250602',
  '4f631653-6886-4f65-b4c4-f5b2e7716105',
  'f1000000-0000-4000-8000-000000000017',
  'Brigitte Vanessa Ospina',
  5,
  'fui con mi novio y nos encanto, la lasana de la casa es la mejor q he probado en popayan. la atencion muy buena, nos explicaron todo',
  null,
  null,
  true, '2026-09-13 16:05:00-05', '2026-09-13 16:05:00-05'
),
(
  'e1000000-0000-4000-8000-000000000018',
  '4ecc760b-0824-4e0f-a6a7-b673c6250602',
  '0703a228-87df-419c-bb0e-5555d2e56c54',
  'f1000000-0000-4000-8000-000000000018',
  'Yorleydi Quintero',
  4,
  'la ensalada cesar estaba fresca y el pollo bien hecho, aunque la salsa le falto un poquito de limon. el pan de ajo muy rico',
  null,
  'Gracias Yorleydi. Ajustamos el limón de la césar. ¡Vuelva cuando quiera!',
  true, '2026-08-22 15:40:00-05', '2026-08-23 10:12:00-05'
),

-- ── Fritanga El Fogón ────────────────────────────────────────────────────────
(
  'e1000000-0000-4000-8000-000000000019',
  '1d989045-f691-448b-956e-47eb58a3aa18',
  'e4a062a8-15bb-444c-b6bc-1b1f3468560d',
  'f1000000-0000-4000-8000-000000000019',
  'Diego Fernando Tovar',
  5,
  'la hamburguesa es tremenda, la carne jugosa y las papas crocantes. por 18 mil es una ganga, ya me volvi cliente',
  null,
  'Gracias Diego. La carne la compramos el mismo día en el mercado. ¡Bienvenido a la casa!',
  true, '2026-11-19 13:05:00-05', '2026-11-19 17:30:00-05'
),
(
  'e1000000-0000-4000-8000-000000000020',
  '1d989045-f691-448b-956e-47eb58a3aa18',
  '691762ad-4158-4cd1-8167-0fe96a905140',
  'f1000000-0000-4000-8000-000000000020',
  'Yuliana Andrea Narváez',
  5,
  'mojarra fresca y bien frita, con bastantes patacones. el lugar es de barrio pero la comida es casera de verdad, se nota',
  null,
  null,
  true, '2026-11-09 12:15:00-05', '2026-11-09 12:15:00-05'
),
(
  'e1000000-0000-4000-8000-000000000021',
  '1d989045-f691-448b-956e-47eb58a3aa18',
  '8a74035d-56cb-418e-ae8a-0d3019d91169',
  'f1000000-0000-4000-8000-000000000021',
  'Jhon Jairo Rojas',
  3,
  'la sopa estaba rica pero me llego casi fria, el maiz si estaba bien. la atencion es buena, solo fue ese detalle',
  null,
  'Gracias Jhon Jairo. Ese día el calentador de la sopa falló; ya lo revisamos. La próxima se la servimos humeando.',
  true, '2026-10-21 11:42:00-05', '2026-10-21 15:00:00-05'
),
(
  'e1000000-0000-4000-8000-000000000022',
  '1d989045-f691-448b-956e-47eb58a3aa18',
  '84a831ff-d037-4550-90c8-8ff530927047',
  'f1000000-0000-4000-8000-000000000022',
  'Deisy Yohana Muñoz',
  4,
  'los patacones con hogao son adictivos, pedimos dos veces. el hogao fresco y bien picado, no como el de otros lados',
  null,
  null,
  true, '2026-10-02 16:18:00-05', '2026-10-02 16:18:00-05'
),
(
  'e1000000-0000-4000-8000-000000000023',
  '1d989045-f691-448b-956e-47eb58a3aa18',
  'f9169700-20cb-48d1-942c-401a959db2ea',
  'f1000000-0000-4000-8000-000000000023',
  'Nelson Eduardo Artunduaga',
  4,
  'el caldo de res es bien casero, con bastante papa y carne. yo soy del huila y alla el caldo es mas fuerte, pero este esta bueno',
  null,
  'Gracias Nelson. Al caldo le ponemos hueso el mismo día. Un saludo para el Huila, que buena cocina tienen.',
  true, '2026-09-15 12:00:00-05', '2026-09-15 19:25:00-05'
),
(
  'e1000000-0000-4000-8000-000000000024',
  '1d989045-f691-448b-956e-47eb58a3aa18',
  '5e4f34fa-78f1-43db-8d87-ece078eaf089',
  'f1000000-0000-4000-8000-000000000024',
  'natalia andrea cerquera',
  5,
  'la arepa de choclo con quesito es lo mejor, me comi dos y quede llena. el precio bien, no es caro',
  null,
  null,
  true, '2026-08-28 09:35:00-05', '2026-08-28 09:35:00-05'
),

-- ── Café Bolívar ─────────────────────────────────────────────────────────────
(
  'e1000000-0000-4000-8000-000000000025',
  '34cecc78-bdc3-447e-b082-03d3b715d9b5',
  '2fa06ab7-e066-4333-80b0-d332399ea52c',
  'f1000000-0000-4000-8000-000000000025',
  'Diana Carolina Chaves',
  5,
  'el capuchino es de los mejores de popayan, el cafe se siente de finca y no quema. la torta de chocolate tambien muy buena',
  null,
  'Gracias Diana. El café es de una finca de Timbío que compramos directo. ¡Nos alegra que se note!',
  true, '2026-11-20 10:25:00-05', '2026-11-20 16:40:00-05'
),
(
  'e1000000-0000-4000-8000-000000000026',
  '34cecc78-bdc3-447e-b082-03d3b715d9b5',
  'be52264a-3eca-457b-916c-5adf5e3535ba',
  'f1000000-0000-4000-8000-000000000026',
  'Felipe Andrés Muñoz',
  5,
  'el cheesecake de mora es otra cosa, no es empalagoso. volveria solo por eso, el cafe tambien muy rico',
  null,
  'Gracias Felipe. La mora la traemos del mercado de Popayán cada semana. ¡Lo esperamos!',
  true, '2026-11-12 17:50:00-05', '2026-11-13 09:10:00-05'
),
(
  'e1000000-0000-4000-8000-000000000027',
  '34cecc78-bdc3-447e-b082-03d3b715d9b5',
  '47742dbd-dc8a-4a4a-9e13-68c748ec489e',
  'f1000000-0000-4000-8000-000000000027',
  'Laura Valentina Palechor',
  4,
  'el waffle estaba rico pero la porcion de frutos rojos es pequena, toco pedir extra. el lugar es bonito para conversar',
  null,
  'Gracias Laura. Ajustamos la porción de frutos rojos. El próximo waffle va bien servido.',
  true, '2026-10-29 16:15:00-05', '2026-10-30 10:00:00-05'
),
(
  'e1000000-0000-4000-8000-000000000028',
  '34cecc78-bdc3-447e-b082-03d3b715d9b5',
  '493abb34-b064-4632-8a72-7c950d6b9914',
  'f1000000-0000-4000-8000-000000000028',
  'Andrés Felipe Zúñiga',
  2,
  'el cafe rico pero la muchacha de la caja nos atendio de mala gana, tocaba repetirle las cosas. por eso no vuelvo',
  null,
  'Le pedimos disculpas, Andrés. Hablamos con la persona de caja; no es la atención que queremos dar. Si nos da otra oportunidad, el café va por nuestra cuenta.',
  true, '2026-10-14 11:20:00-05', '2026-10-14 18:05:00-05'
),
(
  'e1000000-0000-4000-8000-000000000029',
  '34cecc78-bdc3-447e-b082-03d3b715d9b5',
  'c0e9537c-96af-4b6d-a1aa-f11ea68c3f66',
  'f1000000-0000-4000-8000-000000000029',
  'sara sofia chaves',
  5,
  'me lleve el cafe de la finca para la casa y quedo buenisimo, se nota q es tostado aqui mismo. me tome uno antes de irme y todo',
  null,
  null,
  true, '2026-09-25 09:45:00-05', '2026-09-25 09:45:00-05'
),
(
  'e1000000-0000-4000-8000-000000000030',
  '34cecc78-bdc3-447e-b082-03d3b715d9b5',
  '4440657b-ebde-47f7-b24f-4e331a4c51e4',
  'f1000000-0000-4000-8000-000000000030',
  'Brayan Stiven Hoyos',
  4,
  'la torta de chocolate es fresca, no muy dulce. el precio me parece bien por la porcion que dan',
  null,
  null,
  true, '2026-08-19 15:30:00-05', '2026-08-19 15:30:00-05'
),

-- ── Donde Lian ───────────────────────────────────────────────────────────────
(
  'e1000000-0000-4000-8000-000000000031',
  '5a9aa71d-0fa3-406b-bfe2-024dd38a272c',
  '4b7d7924-b228-4fd5-af63-013a3157c2d9',
  'f1000000-0000-4000-8000-000000000031',
  'Julián Andrés Perdomo',
  5,
  'la hamburguesa doble carne es gigante, no pude terminarla. la atencion del señor muy buena, nos pregunto si todo estaba bien',
  null,
  'Gracias Julián. Esa hamburguesa la armamos con dos carnes de 120 g; pocos se la terminan. ¡Vuelva pronto!',
  true, '2026-11-20 13:40:00-05', '2026-11-21 08:55:00-05'
),
(
  'e1000000-0000-4000-8000-000000000032',
  '5a9aa71d-0fa3-406b-bfe2-024dd38a272c',
  '45d97518-3d47-473f-a767-552321befa7d',
  'f1000000-0000-4000-8000-000000000032',
  'Martha Cecilia Riascos',
  5,
  'la bandeja paisa de aqui es la mas completa q he comido, trae de todo y bien servido. no alcance a terminarla',
  null,
  null,
  true, '2026-11-11 12:35:00-05', '2026-11-11 12:35:00-05'
),
(
  'e1000000-0000-4000-8000-000000000033',
  '5a9aa71d-0fa3-406b-bfe2-024dd38a272c',
  'bb5c7a74-b618-410e-be20-2743a45dc94b',
  'f1000000-0000-4000-8000-000000000033',
  'Jhon Alexánder Cedeño',
  4,
  'el ajiaco bogotano estaba bueno aunque le falto un poquito de pollo. el caldo es espeso como debe ser y trae bastante papa',
  null,
  'Gracias Jhon Alexánder. Le pedimos al cocinero revisar la porción de pollo. ¡Gracias por decirlo!',
  true, '2026-10-26 14:05:00-05', '2026-10-27 09:20:00-05'
),
(
  'e1000000-0000-4000-8000-000000000034',
  '5a9aa71d-0fa3-406b-bfe2-024dd38a272c',
  'c43ad520-ea69-476d-81a5-a5007fafc162',
  'f1000000-0000-4000-8000-000000000034',
  'Leidy Marcela Tombé',
  3,
  'pedi ramen por curiosidad y no me gusto mucho, el caldo muy salado. la pizza si es buena, eso si',
  null,
  'Gracias por probarlo, Leidy. El ramen es nuevo y el caldo nos quedó salado; ya bajamos la sal. La pizza siempre está.',
  true, '2026-10-08 19:15:00-05', '2026-10-09 10:30:00-05'
),
(
  'e1000000-0000-4000-8000-000000000035',
  '5a9aa71d-0fa3-406b-bfe2-024dd38a272c',
  '84bd38a6-e43f-4109-b125-34ceb036800d',
  'f1000000-0000-4000-8000-000000000035',
  'Carlos Andrés Fierro',
  5,
  'el sancocho es casero, con bastante yuca y cilantro. me recordo el de mi mama, y eso es mucho decir',
  null,
  'Gracias Carlos. El sancocho se hace desde temprano, a fuego lento. Nos alegra que le haya traído ese recuerdo.',
  true, '2026-09-21 13:10:00-05', '2026-09-21 18:45:00-05'
),
(
  'e1000000-0000-4000-8000-000000000036',
  '5a9aa71d-0fa3-406b-bfe2-024dd38a272c',
  '8f3bb790-9ff9-46f6-83d6-245dfd8d7a13',
  'f1000000-0000-4000-8000-000000000036',
  'Paula Andrea Losada',
  4,
  'el tamal huilense esta bueno, aunque el mio del huila es mas grande jajaja. el precio muy bien y la atencion buena',
  null,
  'Jajaja, Paula, el tamal huilense de allá es otro cuento. Gracias por venir; la esperamos con el suyo cuando quiera.',
  true, '2026-08-24 08:50:00-05', '2026-08-24 12:00:00-05'
),

-- ── Extras: completan la cobertura de reseñas ────────────────────────────────
(
  'e1000000-0000-4000-8000-000000000037',
  '1d989045-f691-448b-956e-47eb58a3aa18',
  '5567a2de-6e34-41b0-98b7-5cb00074f610',
  'f1000000-0000-4000-8000-000000000037',
  'Sandra Milena Orozco',
  5,
  'pedi el salpicon de frutas y viene bien frio y con bastante fruta, no como otros q son puro jugo. me gusto mucho',
  null,
  'Gracias Sandra. La fruta la picamos del día, por eso queda así. ¡Vuelva cuando quiera!',
  true, '2026-11-14 16:30:00-05', '2026-11-15 09:00:00-05'
),
(
  'e1000000-0000-4000-8000-000000000038',
  'ef895a5f-9918-4de2-8b60-1850cba2d441',
  'a7484258-c375-4b56-9120-4c63917213db',
  'f1000000-0000-4000-8000-000000000038',
  'Norbey Alexánder Ipia',
  4,
  'pedimos patacones de entrada y estaban crocantes, con buen hogao. repetimos, aunque la segunda vez si demoraron',
  null,
  'Gracias Norbey. Los patacones los freímos al momento; la segunda tanda coincide con la hora pico. ¡Los esperamos!',
  true, '2026-10-18 18:55:00-05', '2026-10-19 09:30:00-05'
),
(
  'e1000000-0000-4000-8000-000000000039',
  '00f1e4bb-ced9-4a03-8acc-b54aae54abce',
  null,
  'f1000000-0000-4000-8000-000000000039',
  'Jhon Sebastián Muñoz',
  5,
  'fuimos a almorzar y nos atendieron super bien, el plato del dia estaba rico y bien servido. el lugar es sencillo pero limpio',
  null,
  'Gracias Jhon Sebastián. El plato del día cambia cada mañana; lo esperamos otro día.',
  true, '2026-11-17 13:20:00-05', '2026-11-17 19:00:00-05'
),
(
  'e1000000-0000-4000-8000-000000000040',
  '00f1e4bb-ced9-4a03-8acc-b54aae54abce',
  null,
  'f1000000-0000-4000-8000-000000000040',
  'Leidy Yohana Campo',
  4,
  'la comida buena y casera. lo unico es q se demoraron un poquito porque estaba lleno, pero valio la pena',
  null,
  null,
  true, '2026-10-30 12:45:00-05', '2026-10-30 12:45:00-05'
),
(
  'e1000000-0000-4000-8000-000000000041',
  '00f1e4bb-ced9-4a03-8acc-b54aae54abce',
  null,
  'f1000000-0000-4000-8000-000000000041',
  'Wilmer Alexánder Chaves',
  5,
  'me gusto mucho, el señor muy amable y nos explico lo q habia. volveria con mi familia',
  null,
  'Gracias Wilmer. Aquí lo esperamos con la familia.',
  true, '2026-09-28 14:10:00-05', '2026-09-28 18:30:00-05'
),
(
  'e1000000-0000-4000-8000-000000000042',
  'd493652e-3cfb-4eb3-9574-dc04fc47c031',
  null,
  'f1000000-0000-4000-8000-000000000042',
  'Ana María Cerquera',
  5,
  'fui a conocer el lugar y me gusto, la atencion muy buena. la carta va creciendo pero la sazon es casera',
  null,
  'Gracias Ana María. Estamos ampliando la carta; vuelva pronto a probar lo nuevo.',
  true, '2026-11-12 18:05:00-05', '2026-11-13 09:15:00-05'
),
(
  'e1000000-0000-4000-8000-000000000043',
  'd493652e-3cfb-4eb3-9574-dc04fc47c031',
  null,
  'f1000000-0000-4000-8000-000000000043',
  'Juan Camilo Fierro',
  4,
  'buen sitio para almorzar, precios justos. me gusto la sazon, aunque falto un poquito de sal',
  null,
  null,
  true, '2026-10-20 12:30:00-05', '2026-10-20 12:30:00-05'
),
(
  'e1000000-0000-4000-8000-000000000044',
  'd493652e-3cfb-4eb3-9574-dc04fc47c031',
  null,
  'f1000000-0000-4000-8000-000000000044',
  'Karen Dayana Losada',
  5,
  'la pasamos rico, el lugar es tranquilo y la comida rica. recomendado para ir en familia',
  null,
  null,
  true, '2026-09-14 15:40:00-05', '2026-09-14 15:40:00-05'
)
on conflict (id) do nothing;

-- "Es útil": unos pocos votos para que la sección no se vea vacía.
insert into resenas_utiles (resena_id, usuario_id, creado_en) values
  ('e1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-11-17 10:02:00-05'),
  ('e1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002', '2026-11-17 12:44:00-05'),
  ('e1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003', '2026-11-09 09:10:00-05'),
  ('e1000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000004', '2026-11-18 17:30:00-05'),
  ('e1000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000005', '2026-11-19 08:15:00-05'),
  ('e1000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000006', '2026-10-20 11:00:00-05'),
  ('e1000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000007', '2026-11-21 12:20:00-05'),
  ('e1000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000008', '2026-11-21 19:05:00-05'),
  ('e1000000-0000-4000-8000-000000000019', 'a1000000-0000-4000-8000-000000000009', '2026-11-19 20:30:00-05'),
  ('e1000000-0000-4000-8000-000000000025', 'a1000000-0000-4000-8000-000000000010', '2026-11-20 18:10:00-05'),
  ('e1000000-0000-4000-8000-000000000031', 'a1000000-0000-4000-8000-000000000011', '2026-11-21 10:45:00-05')
on conflict do nothing;

-- Votos adicionales de "Es útil" para que el contador tenga variedad.
insert into resenas_utiles (resena_id, usuario_id, creado_en) values
  ('e1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000002', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000003', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000004', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000005', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000006', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000007', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000008', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000009', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000010', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000011', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000012', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000013', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000014', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000015', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000016', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000014', 'b1000000-0000-4000-8000-000000000017', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000014', 'b1000000-0000-4000-8000-000000000018', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000015', 'b1000000-0000-4000-8000-000000000019', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000016', 'b1000000-0000-4000-8000-000000000020', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000016', 'b1000000-0000-4000-8000-000000000021', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000017', 'b1000000-0000-4000-8000-000000000022', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000019', 'b1000000-0000-4000-8000-000000000023', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000019', 'b1000000-0000-4000-8000-000000000024', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000020', 'b1000000-0000-4000-8000-000000000025', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000020', 'b1000000-0000-4000-8000-000000000026', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000021', 'b1000000-0000-4000-8000-000000000027', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000022', 'b1000000-0000-4000-8000-000000000028', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000022', 'b1000000-0000-4000-8000-000000000029', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000023', 'b1000000-0000-4000-8000-000000000030', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000024', 'b1000000-0000-4000-8000-000000000031', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000025', 'b1000000-0000-4000-8000-000000000032', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000025', 'b1000000-0000-4000-8000-000000000033', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000026', 'b1000000-0000-4000-8000-000000000034', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000026', 'b1000000-0000-4000-8000-000000000035', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000027', 'b1000000-0000-4000-8000-000000000036', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000028', 'b1000000-0000-4000-8000-000000000037', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000028', 'b1000000-0000-4000-8000-000000000038', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000029', 'b1000000-0000-4000-8000-000000000039', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000030', 'b1000000-0000-4000-8000-000000000040', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000031', 'b1000000-0000-4000-8000-000000000041', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000031', 'b1000000-0000-4000-8000-000000000042', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000032', 'b1000000-0000-4000-8000-000000000043', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000032', 'b1000000-0000-4000-8000-000000000044', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000033', 'b1000000-0000-4000-8000-000000000045', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000034', 'b1000000-0000-4000-8000-000000000046', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000035', 'b1000000-0000-4000-8000-000000000047', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000035', 'b1000000-0000-4000-8000-000000000048', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000036', 'b1000000-0000-4000-8000-000000000049', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000037', 'b1000000-0000-4000-8000-000000000050', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000038', 'b1000000-0000-4000-8000-000000000051', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000039', 'b1000000-0000-4000-8000-000000000052', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000039', 'b1000000-0000-4000-8000-000000000053', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000040', 'b1000000-0000-4000-8000-000000000054', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000041', 'b1000000-0000-4000-8000-000000000055', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000042', 'b1000000-0000-4000-8000-000000000056', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000042', 'b1000000-0000-4000-8000-000000000057', '2026-11-01 10:00:00-05'),
  ('e1000000-0000-4000-8000-000000000044', 'b1000000-0000-4000-8000-000000000058', '2026-11-01 10:00:00-05')
on conflict do nothing;
