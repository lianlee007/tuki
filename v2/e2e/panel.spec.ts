import { expect, test } from '@playwright/test';
import {
  categoria,
  platillo,
  restaurante,
  simularSesion,
  tema,
  usuarioDueno,
} from './fixtures';

test('el dueño entra al panel y ve su menú', async ({ page }) => {
  await simularSesion(page, usuarioDueno);

  await page.route('**/v1/restaurantes/mios', (ruta) =>
    ruta.fulfill({
      json: {
        restaurante,
        tema,
        cocinas: [],
        categorias: [categoria],
        platillos: [platillo],
        duenoId: usuarioDueno.id,
      },
    }),
  );

  await page.route('**/v1/pedidos/restaurante/**', (ruta) =>
    ruta.fulfill({ json: { pedidos: [] } }),
  );

  await page.route('**/v1/resenas/restaurante/**', (ruta) =>
    ruta.fulfill({ json: { resenas: [], resumen: { promedio: 0, cantidad: 0 } } }),
  );

  await page.goto('/panel');
  await expect(page.getByRole('heading', { name: 'Café Bolívar' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Menú' })).toBeVisible();
  await expect(page.getByText('Capuchino de la casa')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pedidos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reseñas' })).toBeVisible();
});
