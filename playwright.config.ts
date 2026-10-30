import { defineConfig, devices } from '@playwright/test';

/**
 * E2E de Tuki contra la SPA compilada.
 *
 * El flujo no toca la base de datos: busca un plato que ya está sembrado
 * (`Bandeja paisa`), lo agrega al carrito y comprueba que el cierre por
 * WhatsApp aparece. Si la búsqueda deja de devolver datos, el test falla: es
 * justo lo que queremos detectar antes de desplegar.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    locale: 'es-CO',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'pnpm preview --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
