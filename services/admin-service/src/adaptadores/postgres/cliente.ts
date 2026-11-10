import postgres from 'postgres';
import { config } from '../../config.js';

/** Pool de conexiones del BFF de administración. */
export const sql = postgres(config.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  transform: { undefined: null },
});

export const cerrarDb = (): Promise<void> => sql.end({ timeout: 5 });
