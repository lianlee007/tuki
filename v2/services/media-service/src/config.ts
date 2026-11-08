import 'dotenv/config';
import { z } from 'zod';

/** Configuración validada del servicio de medios. */
const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PUERTO: z.coerce.number().int().positive().default(3003),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgres://tuki_media:tuki_media_dev@localhost:5432/tuki_media'),
  JWT_SECRETO: z.string().min(32).default('desarrollo-secreto-de-32-caracteres!!'),
  JWT_EMISOR: z.string().min(1).default('tuki-identidad'),
  JWT_AUDIENCIA: z.string().min(1).default('tuki'),
  CORS_ORIGENES: z
    .string()
    .default('http://localhost:5173,http://localhost:5174,http://localhost:5175'),
  S3_ENDPOINT: z.string().url().default('http://localhost:9000'),
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_BUCKET: z.string().min(1).default('tuki-media'),
  S3_ACCESS_KEY: z.string().min(1).default('tuki_minio'),
  S3_SECRET_KEY: z.string().min(1).default('tuki_minio_dev'),
  S3_PUBLIC_URL: z.string().url().default('http://localhost:9000/tuki-media'),
});

const variables = esquema.parse(process.env);
const secretoDeDesarrollo = 'desarrollo-secreto-de-32-caracteres!!';

if (variables.NODE_ENV === 'production' && variables.JWT_SECRETO === secretoDeDesarrollo) {
  throw new Error('JWT_SECRETO debe cambiarse en producción.');
}

export const config = {
  ...variables,
  esProduccion: variables.NODE_ENV === 'production',
  origenes: variables.CORS_ORIGENES.split(',')
    .map((origen) => origen.trim())
    .filter(Boolean),
} as const;
