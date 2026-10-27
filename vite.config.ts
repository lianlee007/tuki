import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // En desarrollo el navegador habla con Vite y este redirige al gateway.
    // En Docker/Kubernetes sirve Nginx/Ingress por el mismo origen.
    const gateway = env.AI_GATEWAY_DEV_URL || 'http://localhost:8001';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: gateway,
            changeOrigin: false,
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
      }
    };
});
