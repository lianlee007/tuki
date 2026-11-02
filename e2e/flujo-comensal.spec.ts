import { expect, test } from '@playwright/test';

/**
 * Flujo crítico del comensal: descubrir → menú del restaurante → WhatsApp.
 *
 * Es el camino que, si se rompe, deja al restaurante sin pedidos. El carrito
 * exige sesión de cliente, así que el E2E se detiene en el CTA público de
 * WhatsApp; el carrito tiene sus propias pruebas unitarias.
 */
test.describe('descubrir → menú → WhatsApp', () => {
  test('busca un plato y abre el menú del restaurante', async ({ page }) => {
    await page.goto('/');

    // La barra de búsqueda es el punto de entrada del comensal.
    const buscador = page.getByRole('searchbox', { name: /buscar platos/i });
    await expect(buscador).toBeVisible();
    await buscador.fill('bandeja');

    // Hay dos restaurantes con "Bandeja paisa": elegimos uno concreto para no
    // depender del orden del feed. La tarjeta actual nombra el enlace de la
    // imagen como "Ver el menú de <restaurante>".
    const plato = page
      .getByRole('link', { name: 'Ver el menú de Donde Lian' })
      .first();
    await expect(plato).toBeVisible();
    await plato.click();

    await expect(page).toHaveURL(/\/restaurante\/donde-lian/);
    await expect(page.getByText('Donde Lian').first()).toBeVisible();
    await expect(page.getByText(/Restaurante no encontrado/i)).toHaveCount(0);
  });

  test('el menú público ofrece cerrar el pedido por WhatsApp', async ({ page }) => {
    await page.goto('/restaurante/donde-lian');

    const cerrar = page.getByRole('link', { name: /Pedir por WhatsApp/i }).first();
    await expect(cerrar).toBeVisible();
    await expect(cerrar).toHaveAttribute('href', /wa\.me\/57\d+/);
  });
});
