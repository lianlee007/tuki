import postgres from 'postgres';
import { config } from '../config.js';

/**
 * Conexión única a PostgreSQL.
 *
 * El pool es pequeño a propósito: la escala horizontal se resuelve con más
 * réplicas del servicio, no con más conexiones por réplica.
 */
export const sql = postgres(config.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  transform: { undefined: null },
});

export const cerrarDb = (): Promise<void> => sql.end({ timeout: 5 });
