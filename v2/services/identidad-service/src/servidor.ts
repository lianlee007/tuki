import { crearApp } from './app.js';
import { config } from './config.js';
import { cerrarDb } from './db/cliente.js';

/**
 * Punto de entrada del servicio.
 *
 * Cierra la conexión a PostgreSQL y deja de aceptar peticiones ante SIGINT o
 * SIGTERM, que es lo que espera Kubernetes al mover o apagar un pod.
 */
const main = async () => {
  const app = await crearApp();

  const apagar = async (senal: string) => {
    app.log.info({ senal }, 'Apagando identidad-service');
    await app.close();
    await cerrarDb();
    process.exit(0);
  };

  process.once('SIGINT', () => void apagar('SIGINT'));
  process.once('SIGTERM', () => void apagar('SIGTERM'));

  await app.listen({ port: config.PUERTO, host: '0.0.0.0' });
};

main().catch((error) => {
  console.error('[identidad] no pudo arrancar:', error);
  process.exit(1);
});
