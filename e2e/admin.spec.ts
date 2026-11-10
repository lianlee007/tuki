import { expect, test } from '@playwright/test';
import { restaurante, simularSesion, usuarioAdmin } from './fixtures';

test('el superadmin ve panorama, restaurantes y auditoría', async ({ page }) => {
  await simularSesion(page, usuarioAdmin);

  await page.route('**/v1/admin/panorama', (ruta) =>
    ruta.fulfill({
      json: {
        usuarios: { cliente: 10, dueno: 2, superadmin: 1 },
        restaurantes: { total: 1, activos: 1 },
        pedidos: { total: 5, pendientes: 1, ingresos: 50000 },
      },
    }),
  );

  await page.route('**/v1/admin/restaurantes?**', (ruta) =>
    ruta.fulfill({
      json: {
        items: [
          {
            ...restaurante,
            duenoId: '11111111-1111-4111-8111-111111111111',
          },
        ],
        total: 1,
      },
    }),
  );

  await page.route('**/v1/admin/auditoria', (ruta) =>
    ruta.fulfill({
      json: {
        items: [
          {
            id: 'aud-1',
            actorId: usuarioAdmin.id,
            accion: 'activar_restaurante',
            entidad: 'restaurante',
            entidadId: restaurante.id,
            detalle: {},
            creadoEn: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    }),
  );

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Estado de la plataforma' })).toBeVisible();
  await expect(page.getByText('Café Bolívar')).toBeVisible();
  await expect(page.getByText('activar_restaurante')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Suspender' })).toBeVisible();
});
