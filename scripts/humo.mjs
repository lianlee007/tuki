/**
 * Prueba de humo del stack real.
 *
 * Requiere PostgreSQL, RustFS y los seis servicios en marcha:
 *
 *   pnpm infra:up
 *   pnpm dev:all
 *
 * Recorre el flujo de la demo con llamadas HTTP reales: comensal pide, dueño
 * cambia el estado, sube una imagen y el superadmin consulta el panorama.
 */

const BASE = {
  identidad: 'http://localhost:3001',
  restaurantes: 'http://localhost:3002',
  media: 'http://localhost:3003',
  pedidos: 'http://localhost:3004',
  admin: 'http://localhost:3006',
};

const DEMO = {
  cliente: 'cliente@tuki.local',
  dueno: 'dueno1@tuki.local',
  admin: 'admin@tuki.local',
  password: 'Demo12345',
  passwordAdmin: 'Admin12345',
};

const pasos = [];

const pedir = async (url, opciones = {}) => {
  const respuesta = await fetch(url, opciones);
  const texto = await respuesta.text();
  let cuerpo;
  try {
    cuerpo = texto ? JSON.parse(texto) : null;
  } catch {
    cuerpo = texto;
  }
  if (!respuesta.ok) {
    throw new Error(`${opciones.method ?? 'GET'} ${url} -> ${respuesta.status}: ${texto}`);
  }
  return cuerpo;
};

const json = (datos, token) => ({
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify(datos),
});

const login = async (email, password) => {
  const sesion = await pedir(`${BASE.identidad}/v1/identidad/login`, json({ email, password }));
  if (!sesion.accessToken) throw new Error('El login no devolvió accessToken.');
  return sesion.accessToken;
};

const comprobar = (nombre, condicion, detalle = '') => {
  if (!condicion) throw new Error(`Fallo en "${nombre}" ${detalle}`);
  pasos.push(nombre);
  console.log(`  ok  ${nombre}`);
};

const principal = async () => {
  console.log('1. Sesiones demo');
  const tokenCliente = await login(DEMO.cliente, DEMO.password);
  const tokenDueno = await login(DEMO.dueno, DEMO.password);
  const tokenAdmin = await login(DEMO.admin, DEMO.passwordAdmin);
  comprobar('login de cliente, dueño y superadmin', true);

  console.log('2. Descubrimiento');
  const listado = await pedir(`${BASE.restaurantes}/v1/restaurantes?buscar=cafe`);
  comprobar('búsqueda devuelve restaurantes', Array.isArray(listado.items) && listado.items.length > 0);

  const ficha = await pedir(`${BASE.restaurantes}/v1/restaurantes/cafe-bolivar`);
  comprobar('ficha pública trae menú', ficha.platillos.length > 0 && ficha.categorias.length > 0);
  const platillo = ficha.platillos[0];

  console.log('3. Pedido del comensal');
  const pedido = await pedir(
    `${BASE.pedidos}/v1/pedidos`,
    json(
      {
        restauranteId: ficha.restaurante.id,
        items: [{ platilloId: platillo.id, cantidad: 2 }],
        tipoPedido: 'recoger',
        nombreCliente: 'Cliente Demo',
        telefonoCliente: '3001234567',
      },
      tokenCliente,
    ),
  );
  comprobar('el pedido se crea y calcula el total', pedido.total === platillo.precio * 2, `total=${pedido.total}`);

  const creado = await pedir(`${BASE.pedidos}/v1/pedidos/mios`, {
    headers: { authorization: `Bearer ${tokenCliente}` },
  });
  comprobar('el comensal ve su pedido', creado.pedidos?.some((p) => p.id === pedido.id) ?? creado.some?.((p) => p.id === pedido.id));

  console.log('4. Panel del dueño');
  const restaurantelDueno = await pedir(`${BASE.restaurantes}/v1/restaurantes/mios`, {
    headers: { authorization: `Bearer ${tokenDueno}` },
  });
  const restauranteId = restaurantelDueno.restaurante?.id ?? restaurantelDueno.id;
  const pedidosDueno = await pedir(`${BASE.pedidos}/v1/pedidos/restaurante/${restauranteId}`, {
    headers: { authorization: `Bearer ${tokenDueno}` },
  });
  const listaDueno = pedidosDueno.pedidos ?? pedidosDueno;
  comprobar('el dueño ve el pedido nuevo', listaDueno.some((p) => p.id === pedido.id));

  const actualizado = await pedir(
    `${BASE.pedidos}/v1/pedidos/${pedido.id}/estado`,
    {
      ...json({ estado: 'confirmado' }, tokenDueno),
      method: 'PATCH',
    },
  );
  comprobar('el dueño cambia el estado', actualizado.estado === 'confirmado');

  console.log('5. Imagen del menú');
  const imagen = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const formulario = new FormData();
  formulario.append('archivo', new Blob([imagen], { type: 'image/png' }), 'pixel.png');
  const subida = await pedir(`${BASE.media}/v1/media/subir?destino=platillos`, {
    method: 'POST',
    headers: { authorization: `Bearer ${tokenDueno}` },
    body: formulario,
  });
  comprobar('la imagen se guarda en RustFS', Boolean(subida.url), subida.url ?? '');

  const respuestaImagen = await fetch(subida.url);
  comprobar('la imagen es pública', respuestaImagen.ok, `status=${respuestaImagen.status}`);

  console.log('6. Superadmin');
  const panorama = await pedir(`${BASE.admin}/v1/admin/panorama`, {
    headers: { authorization: `Bearer ${tokenAdmin}` },
  });
  comprobar(
    'el panorama suma usuarios, locales y pedidos',
    Boolean(panorama.usuarios && panorama.restaurantes && panorama.pedidos),
  );

  const auditoria = await pedir(`${BASE.admin}/v1/admin/auditoria`, {
    headers: { authorization: `Bearer ${tokenAdmin}` },
  });
  comprobar('la auditoría responde', Array.isArray(auditoria.items));

  console.log(`\nFlujo completo: ${pasos.length} comprobaciones correctas.`);
};

principal().catch((error) => {
  console.error('\nPrueba de humo fallida:');
  console.error(error.message);
  process.exit(1);
});
