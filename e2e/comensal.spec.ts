import { expect, test } from '@playwright/test';
import { simularDescubrir } from './fixtures';

test('el comensal descubre platos y restaurantes', async ({ page }) => {
  await simularDescubrir(page);
  await page.goto('/');

  await expect(page.getByText('¿Qué se te antoja hoy?')).toBeVisible();
  await expect(page.getByText('Capuchino de la casa').first()).toBeVisible();
  await expect(page.getByText('Café Bolívar').first()).toBeVisible();
  await expect(page.getByText('Platos en tendencia')).toBeVisible();
});

test('la búsqueda «patatas321» revela el acceso al panel de superadmin', async ({ page }) => {
  await simularDescubrir(page);
  await page.goto('/');

  const buscador = page.getByRole('searchbox', {
    name: 'Buscar platos, restaurantes o cocinas',
  });
  await buscador.fill('patatas321');

  await expect(page.getByText('Panel de superadministrador')).toBeVisible();
  const acceso = page.getByRole('link', { name: /Entrar al panel/ });
  await expect(acceso).toBeVisible();
  await expect(acceso).toHaveAttribute('href', 'http://localhost:5175');
});
