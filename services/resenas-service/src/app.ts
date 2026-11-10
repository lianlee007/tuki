import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { crearClienteRestaurantes } from './adaptadores/http/restaurantes.cliente.js';
import { crearRepositorioResenas } from './adaptadores/postgres/resenas.repositorio.js';
import { sql } from './adaptadores/postgres/cliente.js';
import { crearCasosDeUsoResenas } from './aplicacion/casos-uso.js';
import { config } from './config.js';
import { registrarRutasResenas } from './entrada/http/resenas.rutas.js';
import autenticacion from './plugins/autenticacion.js';
import errores from './plugins/errores.js';

/** Construye la aplicación sin abrir el puerto. */
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
    servicio: 'resenas',
    ahora: new Date().toISOString(),
  }));

  app.get('/listo', async (_request, reply) => {
    try {
      await sql`select 1`;
      return { estado: 'listo', servicio: 'resenas' };
    } catch {
      return reply.code(503).send({ estado: 'no_listo', servicio: 'resenas' });
    }
  });

  const servicios = crearCasosDeUsoResenas({
    resenas: crearRepositorioResenas(),
    restaurantes: crearClienteRestaurantes(),
  });
  await registrarRutasResenas(app, servicios);

  return app;
};
