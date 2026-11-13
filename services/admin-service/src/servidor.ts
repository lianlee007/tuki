import { crearApp } from './app.js';
import { cerrarDb } from './adaptadores/postgres/cliente.js';
import { config } from './config.js';
import { detenerTrazas } from '@tuki/observabilidad-node';

/** Arranque y apagado ordenado del BFF. */
const main = async () => {
  const app = await crearApp();

  const apagar = async (senal: string) => {
    app.log.info({ senal }, 'Apagando admin-service');
    await app.close();
    await cerrarDb();
    await detenerTrazas();
    process.exit(0);
  };

  process.once('SIGINT', () => void apagar('SIGINT'));
  process.once('SIGTERM', () => void apagar('SIGTERM'));

  await app.listen({ port: config.PUERTO, host: '0.0.0.0' });
};

main().catch((error) => {
  console.error('[admin] no pudo arrancar:', error);
  process.exit(1);
});
