import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { sql } from './adaptadores/postgres/cliente.js';
import { crearServiciosRestaurantes } from './composicion.js';
import { config } from './config.js';
import { registrarRutasAdminRestaurantes } from './entrada/http/admin.rutas.js';
import { registrarRutasMenu } from './entrada/http/menu.rutas.js';
import { registrarRutasPanel } from './entrada/http/panel.rutas.js';
import { registrarRutasPublicas } from './entrada/http/publico.rutas.js';
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

  const casos = crearServiciosRestaurantes();
  await registrarRutasPublicas(app, casos);
  await registrarRutasPanel(app, casos);
  await registrarRutasMenu(app, casos);
  await registrarRutasAdminRestaurantes(app, casos);

  await registrarMetricas(app, 'restaurantes-service');

  return app;
};
