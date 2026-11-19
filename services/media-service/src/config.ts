import 'dotenv/config';
import { z } from 'zod';

/** ConfiguraciÃ³n validada del servicio de medios. */
const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PUERTO: z.coerce.number().int().positive().default(3003),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgres://tuki_media:tuki_media_dev@127.0.0.1:5432/tuki_media'),
  JWT_SECRETO: z.string().min(32).default('desarrollo-secreto-de-32-caracteres!!'),
  JWT_EMISOR: z.string().min(1).default('tuki-identidad'),
  JWT_AUDIENCIA: z.string().min(1).default('tuki'),
  CORS_ORIGENES: z
    .string()
    .default('http://localhost:5173,http://localhost:5174,http://localhost:5175'),
  // 127.0.0.1 y no `localhost`: en Windows `localhost` resuelve primero a ::1
  // y el proxy de Docker Desktop deja la conexiÃ³n colgada hasta 40 s.
  S3_ENDPOINT: z.string().url().default('http://127.0.0.1:9000'),
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_BUCKET: z.string().min(1).default('tuki-media'),
  S3_ACCESS_KEY: z.string().min(1).default('tuki_s3'),
  S3_SECRET_KEY: z.string().min(1).default('tuki_s3_dev'),
  S3_PUBLIC_URL: z.string().url().default('http://127.0.0.1:9000/tuki-media'),
  // Servicio de visiÃ³n: revisa que la foto del plato sea comida antes de
  // guardarla. Si no responde, la subida sigue (fail-open).
  VISION_URL: z.string().url().default('http://127.0.0.1:8002'),
  VISION_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
});

const variables = esquema.parse(process.env);
const secretoDeDesarrollo = 'desarrollo-secreto-de-32-caracteres!!';

if (variables.NODE_ENV === 'production' && variables.JWT_SECRETO === secretoDeDesarrollo) {
  throw new Error('JWT_SECRETO debe cambiarse en producciÃ³n.');
}

export const config = {
  ...variables,
  esProduccion: variables.NODE_ENV === 'production',
  origenes: variables.CORS_ORIGENES.split(',')
    .map((origen) => origen.trim())
    .filter(Boolean),
} as const;
