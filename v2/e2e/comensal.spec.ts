import { expect, test } from '@playwright/test';
import {
  categoria,
  platillo,
  restaurante,
  simularRestaurantes,
  tema,
} from './fixtures';

test('el comensal descubre, abre la ficha y agrega al carrito', async ({ page }) => {
  await simularRestaurantes(page, [
    {
      ...restaurante,
      platosCantidad: 1,
      precioMin: 8500,
      precioMax: 8500,
    },
  ]);

  await page.route('**/v1/resenas/restaurante/**', (ruta) =>
    ruta.fulfill({
      json: { resenas: [], resumen: { promedio: 4.8, cantidad: 10 } },
    }),
  );

  await page.route('**/v1/restaurantes/cafe-bolivar', (ruta) =>
    ruta.fulfill({
      json: {
        restaurante,
        tema,
        cocinas: [{ id: 't1', slug: 'cafeteria', nombre: 'Cafetería', icono: 'Coffee' }],
        categorias: [categoria],
        platillos: [platillo],
      },
    }),
  );

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Descubre qué comer hoy' })).toBeVisible();
  await page.getByRole('link', { name: /Café Bolívar/ }).click();

  await expect(page.getByRole('heading', { name: 'Café Bolívar' })).toBeVisible();
  await expect(page.getByText('Capuchino de la casa')).toBeVisible();

  await page.getByRole('button', { name: 'Agregar' }).click();
  await expect(page.getByText(/Tu pedido en Café Bolívar/)).toBeVisible();
  await expect(page.getByText('Total: $8.500', { exact: true })).toBeVisible();
});
