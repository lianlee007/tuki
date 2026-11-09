import { expect, test } from '@playwright/test';
import { simularPanel, simularSesion, usuarioDueno } from './fixtures';

test('el dueño entra al panel y ve sus secciones', async ({ page }) => {
  await simularSesion(page, usuarioDueno);
  await simularPanel(page);

  await page.goto('/panel');

  await expect(page.getByRole('heading', { name: 'Configuración' })).toBeVisible();
  const navegacion = page.getByRole('navigation');
  for (const seccion of ['Restaurante', 'Menú', 'Pedidos', 'Reseñas', 'Apariencia']) {
    await expect(navegacion.getByRole('button', { name: seccion, exact: true })).toBeVisible();
  }
  await expect(page.locator('input[name="nombre"]')).toHaveValue('Café Bolívar');
});
