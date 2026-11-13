/**
 * Trazas OpenTelemetry con exportación OTLP/HTTP.
 *
 * Se instrumenta el módulo HTTP de Node, que cubre las peticiones entrantes de
 * Fastify y las llamadas salientes entre servicios. No se usa
 * `auto-instrumentations-node`: arrastraba más de doscientas dependencias
 * (AWS, Mongo, OpenAI, etc.) que no se ejecutan aquí y hacían lentísimo el
 * build de las imágenes.
 *
 * Si `OTEL_EXPORTER_OTLP_ENDPOINT` no está definido, la instrumentación queda
 * apagada y el servicio funciona igual.
 */
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';

let sdk: NodeSDK | undefined;

export const iniciarTrazas = (servicio: string): void => {
  if (sdk) return;

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  if (!endpoint || process.env.OTEL_SDK_DISABLED === 'true') return;

  const base = endpoint.replace(/\/+$/, '');
  const url = base.endsWith('/v1/traces') ? base : `${base}/v1/traces`;

  const nuevo = new NodeSDK({
    resource: resourceFromAttributes({
      'service.name': servicio,
      'service.namespace': process.env.OTEL_SERVICE_NAMESPACE ?? 'tukituki',
      'deployment.environment': process.env.NODE_ENV ?? 'development',
    }),
    traceExporter: new OTLPTraceExporter({ url }),
    instrumentations: [new HttpInstrumentation()],
  });

  try {
    nuevo.start();
    sdk = nuevo;
  } catch (error) {
    console.error('[observabilidad] no se pudo iniciar OpenTelemetry:', error);
  }
};

export const detenerTrazas = async (): Promise<void> => {
  if (!sdk) return;
  const actual = sdk;
  sdk = undefined;
  await actual.shutdown();
};
