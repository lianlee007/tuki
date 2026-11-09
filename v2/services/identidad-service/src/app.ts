import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { sql } from './adaptadores/postgres/cliente.js';
import { crearServiciosIdentidad } from './composicion.js';
import { config } from './config.js';
import { registrarRutasIdentidad } from './entrada/http/identidad.rutas.js';
import { registrarRutasAdminIdentidad } from './entrada/http/identidad.admin.rutas.js';
import autenticacion from './plugins/autenticacion.js';
import errores from './plugins/errores.js';

/**
 * Construye la aplicación sin escuchar el puerto.
 *
 * Separar la construcción del arranque permite probar la app con inyección de
 * peticiones y reutilizarla en el servidor real.
 */
export const crearApp = async () => {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'development' ? 'info' : 'warn',
    },
    trustProxy: true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: config.origenes,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
  });

  const { casos, tokens } = crearServiciosIdentidad();

  await app.register(errores);
  await app.register(autenticacion, { tokens });

  app.get('/salud', async () => ({
    estado: 'ok',
    servicio: 'identidad',
    ahora: new Date().toISOString(),
  }));

  app.get('/listo', async (_request, reply) => {
    try {
      await sql`select 1`;
      return { estado: 'listo', servicio: 'identidad' };
    } catch {
      return reply.code(503).send({ estado: 'no_listo', servicio: 'identidad' });
    }
  });

  await registrarRutasIdentidad(app, casos);
  await registrarRutasAdminIdentidad(app, casos);

  return app;
};
