import 'dotenv/config';
import { z } from 'zod';

/** Configuración validada del servicio de reseñas. */
const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PUERTO: z.coerce.number().int().positive().default(3005),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgres://tuki_resenas:tuki_resenas_dev@localhost:5432/tuki_resenas'),
  JWT_SECRETO: z.string().min(32).default('desarrollo-secreto-de-32-caracteres!!'),
  JWT_EMISOR: z.string().min(1).default('tuki-identidad'),
  JWT_AUDIENCIA: z.string().min(1).default('tuki'),
  RESTAURANTES_URL: z.string().url().default('http://localhost:3002'),
  CORS_ORIGENES: z
    .string()
    .default('http://localhost:5173,http://localhost:5174,http://localhost:5175'),
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
