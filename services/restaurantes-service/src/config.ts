import 'dotenv/config';
import { z } from 'zod';

/** ConfiguraciÃ³n validada al arranque del servicio. */
const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PUERTO: z.coerce.number().int().positive().default(3002),
  DATABASE_URL: z
    .string()
    .min(1)
    .default(
      'postgres://tuki_restaurantes:tuki_restaurantes_dev@127.0.0.1:5432/tuki_restaurantes',
    ),
  JWT_SECRETO: z.string().min(32).default('desarrollo-secreto-de-32-caracteres!!'),
  JWT_EMISOR: z.string().min(1).default('tuki-identidad'),
  JWT_AUDIENCIA: z.string().min(1).default('tuki'),
  CORS_ORIGENES: z
    .string()
    .default('http://localhost:5173,http://localhost:5174,http://localhost:5175'),
  // Base pÃºblica de las imÃ¡genes (`https://api/tuki-media`). Si falta se
  // respetan las URLs guardadas, como en el entorno local con RustFS.
  MEDIA_PUBLIC_URL: z.string().url().optional(),
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
