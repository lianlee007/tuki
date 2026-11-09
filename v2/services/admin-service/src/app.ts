import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { crearServiciosRemotos } from './adaptadores/http/servicios.cliente.js';
import { crearRepositorioAuditoria } from './adaptadores/postgres/auditoria.repositorio.js';
import { sql } from './adaptadores/postgres/cliente.js';
import { crearCasosDeUsoAdmin } from './aplicacion/casos-uso.js';
import { config } from './config.js';
import { registrarRutasAdmin } from './entrada/http/admin.rutas.js';
import autenticacion from './plugins/autenticacion.js';
import errores from './plugins/errores.js';

/** Construye el BFF sin abrir el puerto. */
export const crearApp = async () => {
  const app = Fastify({
    logger: { level: config.NODE_ENV === 'development' ? 'info' : 'warn' },
    trustProxy: true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: config.origenes, credentials: true });
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  await app.register(errores);
  await app.register(autenticacion);

  app.get('/salud', async () => ({
    estado: 'ok',
    servicio: 'admin',
    ahora: new Date().toISOString(),
  }));

  app.get('/listo', async (_request, reply) => {
    try {
      await sql`select 1`;
      return { estado: 'listo', servicio: 'admin' };
    } catch {
      return reply.code(503).send({ estado: 'no_listo', servicio: 'admin' });
    }
  });

  const servicios = crearCasosDeUsoAdmin({
    remotos: crearServiciosRemotos(),
    auditoria: crearRepositorioAuditoria(),
  });
  await registrarRutasAdmin(app, servicios);

  return app;
};
