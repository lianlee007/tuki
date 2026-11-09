import type { Page } from '@playwright/test';

export const usuarioDueno = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'dueno1@tuki.local',
  nombre: 'Dueño',
  apellido: 'Café',
  rol: 'dueno',
  emailVerificado: true,
  creadoEn: '2026-01-01T00:00:00.000Z',
};

export const usuarioAdmin = {
  id: '99999999-9999-4999-8999-999999999999',
  email: 'admin@tuki.local',
  nombre: 'Super',
  apellido: 'Admin',
  rol: 'superadmin',
  emailVerificado: true,
  creadoEn: '2026-01-01T00:00:00.000Z',
};

export const restaurante = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  slug: 'cafe-bolivar',
  nombre: 'Café Bolívar',
  descripcion: 'Café de especialidad y repostería.',
  eslogan: 'El mejor café de la ciudad',
  telefono: '3001234567',
  whatsapp: '3001234567',
  email: 'cafe@tuki.local',
  direccion: 'Calle 5 # 4-21',
  ciudad: 'Popayán',
  departamento: 'Cauca',
  imagenLogoUrl: null,
  imagenBannerUrl: null,
  horarioApertura: '08:00',
  horarioCierre: '20:00',
  activo: true,
  creadoEn: '2026-01-01T00:00:00.000Z',
};

export const tema = {
  id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  restauranteId: restaurante.id,
  estiloPlantilla: 'moderno',
  colorPrimario: '#EA580C',
  colorSecundario: '#16A34A',
  colorFondo: '#FDF8F3',
  colorTexto: '#2A1B12',
  colorTextoTitulos: '#1A0F08',
  fuenteTitulos: 'Playfair Display',
  fuenteCuerpo: 'Inter',
};

export const categoria = {
  id: 'c1111111-1111-4111-8111-111111111111',
  restauranteId: restaurante.id,
  nombre: 'Cafés',
  descripcion: null,
  icono: 'coffee',
  orden: 1,
};

export const platillo = {
  id: 'd1111111-1111-4111-8111-111111111111',
  restauranteId: restaurante.id,
  categoriaId: categoria.id,
  nombre: 'Capuchino de la casa',
  descripcion: 'Espresso doble y leche vaporizada.',
  precio: 8500,
  imagenUrl: null,
  disponible: true,
  activo: true,
  vegetariano: true,
  vegano: false,
  picante: false,
  orden: 1,
};

export const cocina = {
  id: 'c2222222-2222-4222-8222-222222222222',
  slug: 'cafeteria',
  nombre: 'Cafetería',
  icono: 'Coffee',
};

export const cabeceras = { 'access-control-allow-origin': '*' };

/** Simula la sesión guardada y el perfil del servicio de identidad. */
export const simularSesion = async (page: Page, usuario: typeof usuarioDueno) => {
  await page.addInitScript(() => {
    localStorage.setItem('tuki.access', 'token-de-prueba');
    localStorage.setItem('tuki.refresh', 'refresh-de-prueba');
  });

  await page.route('**/v1/identidad/perfil', (ruta) =>
    ruta.fulfill({ json: { usuario }, headers: cabeceras }),
  );
};

/** Datos mínimos del panel: restaurante, tema, cocinas, categorías y platos. */
export const simularPanel = async (page: Page) => {
  const panel = {
    restaurante,
    tema,
    cocinas: [cocina],
    categorias: [categoria],
    platillos: [platillo],
    duenoId: usuarioDueno.id,
  };

  await page.route('**/v1/restaurantes/cocinas', (ruta) =>
    ruta.fulfill({ json: { cocinas: [cocina] }, headers: cabeceras }),
  );

  await page.route('**/v1/restaurantes/mios', (ruta) =>
    ruta.fulfill({ json: panel, headers: cabeceras }),
  );

  await page.route(/\/v1\/restaurantes\/[0-9a-f-]+\/panel$/, (ruta) =>
    ruta.fulfill({ json: panel, headers: cabeceras }),
  );

  await page.route('**/v1/pedidos/restaurante/**', (ruta) =>
    ruta.fulfill({ json: { pedidos: [] }, headers: cabeceras }),
  );

  await page.route('**/v1/resenas/restaurante/**', (ruta) =>
    ruta.fulfill({
      json: { resenas: [], resumen: { promedio: 0, cantidad: 0 } },
      headers: cabeceras,
    }),
  );
};

/** Datos del buscador: cocinas, platos y restaurantes. */
export const simularDescubrir = async (page: Page) => {
  await page.route('**/v1/restaurantes/cocinas', (ruta) =>
    ruta.fulfill({ json: { cocinas: [cocina] }, headers: cabeceras }),
  );

  await page.route('**/v1/restaurantes/platos?**', (ruta) =>
    ruta.fulfill({
      json: {
        items: [
          {
            ...platillo,
            restauranteNombre: restaurante.nombre,
            restauranteSlug: restaurante.slug,
            ciudad: restaurante.ciudad,
            cocina: cocina.nombre,
          },
        ],
        total: 1,
        desde: 0,
        limite: 24,
      },
      headers: cabeceras,
    }),
  );

  await page.route(/\/v1\/restaurantes\?.*/, (ruta) =>
    ruta.fulfill({
      json: {
        items: [
          {
            ...restaurante,
            platosCantidad: 1,
            precioMin: 8500,
            precioMax: 8500,
          },
        ],
        total: 1,
        desde: 0,
        limite: 8,
      },
      headers: cabeceras,
    }),
  );
};
