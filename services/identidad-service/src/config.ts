import 'dotenv/config';
import { z } from 'zod';

/**
 * ConfiguraciÃ³n del servicio.
 *
 * Se valida una sola vez al arrancar: si falta una variable crÃ­tica, el proceso
 * falla antes de aceptar peticiones. En producciÃ³n no se permite el secreto de
 * desarrollo.
 */
const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PUERTO: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgres://tuki_identidad:tuki_identidad_dev@127.0.0.1:5432/tuki_identidad'),
  JWT_SECRETO: z.string().min(32).default('desarrollo-secreto-de-32-caracteres!!'),
  JWT_EMISOR: z.string().min(1).default('tuki-identidad'),
  JWT_AUDIENCIA: z.string().min(1).default('tuki'),
  CORS_ORIGENES: z
    .string()
    .default('http://localhost:5173,http://localhost:5174,http://localhost:5175'),
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
