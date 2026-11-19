import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { crearAlmacenS3 } from './adaptadores/s3/almacen.js';
import { crearClasificadorVision } from './adaptadores/vision/clasificador.js';
import { crearRepositorioMedia } from './adaptadores/postgres/media.repositorio.js';
import { sql } from './adaptadores/postgres/cliente.js';
import { crearCasosDeUsoMedia } from './aplicacion/casos-uso.js';
import { config } from './config.js';
import { registrarRutasMedia } from './entrada/http/media.rutas.js';
import autenticacion from './plugins/autenticacion.js';
import errores from './plugins/errores.js';
import { registrarMetricas } from '@tuki/observabilidad-node';

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

  const servicios = crearCasosDeUsoMedia({
    media: crearRepositorioMedia(),
    almacen: crearAlmacenS3(),
    clasificador: crearClasificadorVision(),
  });
  await registrarRutasMedia(app, servicios);

  await registrarMetricas(app, 'media-service');

  return app;
};
