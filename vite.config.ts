import path from 'path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // En desarrollo el navegador habla con Vite y este redirige al gateway.
    // En Docker/Kubernetes sirve Nginx/Ingress por el mismo origen.
    const gateway = env.AI_GATEWAY_DEV_URL || 'http://localhost:8001';
    // El servicio de visión escucha en 8002; /vision se recorta antes de
    // reenviar porque el servicio expone /api/v1/vision/... .
    const vision = env.VISION_DEV_URL || 'http://localhost:8002';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: gateway,
            changeOrigin: false,
          },
          '/vision': {
            target: vision,
            changeOrigin: false,
            rewrite: (ruta) => ruta.replace(/^\/vision/, ''),
          },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        },
        dedupe: ['zod', '@hookform/resolvers'],
        preserveSymlinks: false
      },
      optimizeDeps: {
        include: ['zod', '@hookform/resolvers']
      },
      // Vitest no debe recoger los E2E de Playwright (otro runner, otro ciclo).
      test: {
        exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
      }
    };
});
