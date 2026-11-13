import { defineConfig } from 'tsup';

/**
 * Empaquetado del servicio de pedidos.
 *
 * `@tuki/dominio` se compila dentro del bundle porque es solo TypeScript y no
 * tiene build propio. `@tuki/observabilidad-node` sí se publica compilado, así
 * que se deja externo para que prom-client y OpenTelemetry se resuelvan desde
 * node_modules (bundled provocaría "Dynamic require of util").
 */
export default defineConfig({
  entry: ['src/servidor.ts', 'src/telemetria.ts', 'src/db/migrar.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  noExternal: ['@tuki/dominio'],
});
