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
