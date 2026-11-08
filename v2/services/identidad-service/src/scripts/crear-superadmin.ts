import 'dotenv/config';
import { z } from 'zod';
import { crearSuperadmin } from '../modulos/identidad/identidad.service.js';
import { cerrarDb } from '../db/cliente.js';

/**
 * Crea el superadmin inicial.
 *
 * No existe registro público para este rol: la cuenta se aprovisiona desde el
 * entorno del despliegue con `pnpm db:superadmin`.
 */
const esquema = z.object({
  SUPERADMIN_EMAIL: z.string().trim().toLowerCase().email(),
  SUPERADMIN_PASSWORD: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/\d/),
  SUPERADMIN_NOMBRE: z.string().trim().min(1).default('Super'),
  SUPERADMIN_APELLIDO: z.string().trim().min(1).default('Admin'),
});

const ejecutar = async () => {
  const datos = esquema.parse(process.env);
  const usuario = await crearSuperadmin({
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
