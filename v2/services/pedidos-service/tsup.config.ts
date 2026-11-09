import { defineConfig } from 'tsup';

/**
 * Empaquetado del servicio de pedidos.
 *
 * `@tuki/dominio` se compila dentro del bundle porque la imagen de producción
 * solo publica dependencias y Node no puede ejecutar TypeScript desde
 * `node_modules`. El resto de dependencias siguen siendo externas.
 */
export default defineConfig({
  entry: ['src/servidor.ts', 'src/db/migrar.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  noExternal: [/^@tuki\//],
});
