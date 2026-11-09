import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de interfaz con las APIs simuladas.
 *
 * No necesitan PostgreSQL ni Docker: cada spec intercepta las respuestas de
 * los microservicios. Así se valida la navegación, la sesión y el render de los
 * tres frontends en cualquier máquina.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list']],
  use: {
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'comensal',
      testMatch: /comensal\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173' },
    },
    {
      name: 'panel',
      testMatch: /panel\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5174' },
    },
    {
      name: 'admin',
      testMatch: /admin\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5175' },
    },
  ],
  webServer: [
    {
      command: 'pnpm dev:comensal',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'pnpm dev:panel',
      url: 'http://localhost:5174',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'pnpm dev:admin',
      url: 'http://localhost:5175',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
