import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { sql } from './db/cliente.js';
import autenticacion from './plugins/autenticacion.js';
import errores from './plugins/errores.js';
import { registrarRutasMedia } from './modulos/media/media.routes.js';

/** Construye la aplicación sin abrir el puerto. */
export const crearApp = async () => {
  const app = Fastify({
    logger: { level: config.NODE_ENV === 'development' ? 'info' : 'warn' },
    trustProxy: true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: config.origenes, credentials: true });
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  await app.register(multipart, {
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  });
  await app.register(errores);
  await app.register(autenticacion);

  app.get('/salud', async () => ({
    estado: 'ok',
    servicio: 'media',
    ahora: new Date().toISOString(),
  }));

  app.get('/listo', async (_request, reply) => {
    try {
      await sql`select 1`;
      return { estado: 'listo', servicio: 'media' };
    } catch {
      return reply.code(503).send({ estado: 'no_listo', servicio: 'media' });
    }
  });

  await app.register(registrarRutasMedia);

  return app;
};
