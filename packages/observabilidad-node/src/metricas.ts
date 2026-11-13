/**
 * Métricas Prometheus de un servicio Fastify.
 *
 * Se registran métricas RED (Rate, Errors, Duration) con la ruta declarada y
 * no con la URL cruda: así se evita una cardinalidad descontrolada cuando
 * llegan identificadores en el path.
 */
import client from 'prom-client';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

type PeticionConInicio = FastifyRequest & { __tukiInicio?: bigint };

const registro = new client.Registry();
client.collectDefaultMetrics({ register: registro, prefix: 'tuki_' });

const peticiones = new client.Counter({
  name: 'tuki_http_requests_total',
  help: 'Peticiones HTTP atendidas por el servicio.',
  labelNames: ['app', 'method', 'route', 'status'] as const,
  registers: [registro],
});

const duracion = new client.Histogram({
  name: 'tuki_http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos.',
  labelNames: ['app', 'method', 'route', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registro],
});

const enCurso = new client.Gauge({
  name: 'tuki_http_inflight_requests',
  help: 'Peticiones en curso en este proceso.',
  labelNames: ['app'] as const,
  registers: [registro],
});

/**
 * Añade `/metrics` y los hooks de medición a una app Fastify.
 *
 * La ruta es pública a propósito: Prometheus la raspa por red interna y no
 * debe depender de un JWT. El NetworkPolicy limita el acceso al namespace de
 * monitoreo.
 */
export const registrarMetricas = async (
  app: FastifyInstance,
  servicio: string,
): Promise<void> => {
  app.addHook('onRequest', async (request) => {
    enCurso.labels(servicio).inc();
    (request as PeticionConInicio).__tukiInicio = process.hrtime.bigint();
  });

  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    enCurso.labels(servicio).dec();

    const ruta = request.routeOptions?.url ?? 'unmatched';
    if (ruta === '/metrics') return;

    const metodo = request.method;
    const estado = String(reply.statusCode);
    peticiones.labels(servicio, metodo, ruta, estado).inc();

    const inicio = (request as PeticionConInicio).__tukiInicio;
    if (inicio !== undefined) {
      const segundos = Number(process.hrtime.bigint() - inicio) / 1_000_000_000;
      duracion.labels(servicio, metodo, ruta, estado).observe(segundos);
    }
  });

  app.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', registro.contentType);
    return registro.metrics();
  });
};
