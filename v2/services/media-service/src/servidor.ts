import { crearApp } from './app.js';
import { cerrarDb } from './adaptadores/postgres/cliente.js';
import { config } from './config.js';

/** Arranque y apagado ordenado del servicio. */
const main = async () => {
  const app = await crearApp();

  const apagar = async (senal: string) => {
    app.log.info({ senal }, 'Apagando media-service');
    await app.close();
    await cerrarDb();
    process.exit(0);
  };

  process.once('SIGINT', () => void apagar('SIGINT'));
  process.once('SIGTERM', () => void apagar('SIGTERM'));

  await app.listen({ port: config.PUERTO, host: '0.0.0.0' });
};

main().catch((error) => {
  console.error('[media] no pudo arrancar:', error);
  process.exit(1);
});
