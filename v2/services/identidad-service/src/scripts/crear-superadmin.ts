import 'dotenv/config';
import { z } from 'zod';
import { cerrarDb } from '../adaptadores/postgres/cliente.js';
import { crearServiciosIdentidad } from '../composicion.js';

/**
 * Crea el superadmin inicial.
 *
 * No existe registro público para este rol: la cuenta se aprovisiona desde el
 * entorno del despliegue con `pnpm db:superadmin`.
 */
const esquema = z.object({
  SUPERADMIN_EMAIL: z.string().trim().toLowerCase().email().default('admin@tukituki.local'),
  SUPERADMIN_PASSWORD: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/\d/)
    .default('Admin12345'),
  SUPERADMIN_NOMBRE: z.string().trim().min(1).default('Super'),
  SUPERADMIN_APELLIDO: z.string().trim().min(1).default('Admin'),
});

const ejecutar = async () => {
  const datos = esquema.parse(process.env);
  const { casos } = crearServiciosIdentidad();
  const usuario = await casos.crearSuperadmin({
    email: datos.SUPERADMIN_EMAIL,
    password: datos.SUPERADMIN_PASSWORD,
    nombre: datos.SUPERADMIN_NOMBRE,
    apellido: datos.SUPERADMIN_APELLIDO,
  });

  console.log(`[superadmin] listo: ${usuario.email} (${usuario.id})`);
};

ejecutar()
  .then(() => cerrarDb())
  .catch(async (error) => {
    console.error('[superadmin] error:', error);
    await cerrarDb();
    process.exit(1);
  });
