import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { sql, cerrarDb } from './cliente.js';

/**
 * Ejecutor de migraciones.
 *
 * Cada archivo `.sql` se aplica una sola vez y dentro de una transacción. El
 * registro queda en `migraciones`, así que repetir el comando es seguro.
 */
const ejecutar = async () => {
  const carpeta = path.resolve(process.cwd(), 'db/migraciones');
  await sql`
    create table if not exists migraciones (
      nombre text primary key,
      aplicada_en timestamptz not null default now()
    )
  `;

  const archivos = (await readdir(carpeta))
    .filter((archivo) => archivo.endsWith('.sql'))
    .sort();

  for (const archivo of archivos) {
    const [existente] = await sql<{ nombre: string }[]>`
      select nombre from migraciones where nombre = ${archivo}
    `;
    if (existente) {
      console.log(`[migrar] ya aplicada: ${archivo}`);
      continue;
    }

    const contenido = await readFile(path.join(carpeta, archivo), 'utf8');
    await sql.begin(async (transaccion) => {
      await transaccion.unsafe(contenido);
      await transaccion`insert into migraciones (nombre) values (${archivo})`;
    });
    console.log(`[migrar] aplicada: ${archivo}`);
  }
};

ejecutar()
  .then(() => cerrarDb())
  .catch(async (error) => {
    console.error('[migrar] error:', error);
    await cerrarDb();
    process.exit(1);
  });
