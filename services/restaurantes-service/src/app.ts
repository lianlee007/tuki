import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { sql } from './db/cliente.js';
import autenticacion from './plugins/autenticacion.js';
import errores from './plugins/errores.js';
import { registrarRutasPublicas } from './modulos/restaurantes/publico.routes.js';
import { registrarRutasPanel } from './modulos/restaurantes/panel.routes.js';
import { registrarRutasMenu } from './modulos/restaurantes/menu.routes.js';
import { registrarRutasAdminRestaurantes } from './modulos/restaurantes/admin.routes.js';

/** Construye la aplicación sin abrir el puerto. */
export const crearApp = async () => {
  const app = Fastify({
    logger: { level: config.NODE_ENV === 'development' ? 'info' : 'warn' },
    trustProxy: true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: config.origenes, credentials: true });
  await app.register(rateLimit, { max: 180, timeWindow: '1 minute' });
  await app.register(errores);
  await app.register(autenticacion);

  app.get('/salud', async () => ({
    estado: 'ok',
    servicio: 'restaurantes',
    ahora: new Date().toISOString(),
  }));

  app.get('/listo', async (_request, reply) => {
    try {
      await sql`select 1`;
      return { estado: 'listo', servicio: 'restaurantes' };
    } catch {
      return reply.code(503).send({ estado: 'no_listo', servicio: 'restaurantes' });
    }
  });

  await app.register(registrarRutasPublicas);
  await app.register(registrarRutasPanel);
  await app.register(registrarRutasMenu);
  await app.register(registrarRutasAdminRestaurantes);

  return app;
};
