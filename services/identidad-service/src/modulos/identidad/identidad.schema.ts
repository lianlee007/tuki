import { z } from 'zod';

/**
 * Contratos de entrada del servicio.
 *
 * La validación vive en el borde HTTP. El servicio recibe datos ya tipados y
 * no repite comprobaciones de formato.
 */
const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'El correo es obligatorio.')
  .max(160, 'El correo es demasiado largo.')
  .email('El correo no tiene un formato válido.');

const password = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .max(128, 'La contraseña es demasiado larga.')
  .regex(/[A-Z]/, 'La contraseña debe incluir una mayúscula.')
  .regex(/[a-z]/, 'La contraseña debe incluir una minúscula.')
  .regex(/\d/, 'La contraseña debe incluir un número.');

const nombre = z
  .string()
  .trim()
  .min(1, 'El nombre es obligatorio.')
  .max(80, 'El nombre es demasiado largo.');

const apellido = z
  .string()
  .trim()
  .min(1, 'El apellido es obligatorio.')
  .max(80, 'El apellido es demasiado largo.');

export const esquemaRegistro = z.object({
  email,
  password,
  nombre,
  apellido,
  // El registro público nunca puede crear un superadmin.
  rol: z.enum(['cliente', 'dueno']).default('cliente'),
});

export const esquemaLogin = z.object({
  email,
  password: z.string().min(1, 'La contraseña es obligatoria.').max(128),
});

export const esquemaRefresh = z.object({
  refreshToken: z.string().min(20, 'El token de refresco no es válido.'),
});

export const esquemaLogout = z.object({
  refreshToken: z.string().min(20, 'El token de refresco no es válido.'),
});

export const esquemaRol = z.object({
  rol: z.enum(['cliente', 'dueno', 'superadmin']),
});

/** Campos de la propia cuenta que el usuario puede cambiar. */
export const esquemaPerfil = z.object({
  nombre: nombre.optional(),
  apellido: apellido.optional(),
  avatarUrl: z.string().trim().url().max(500).nullable().optional(),
});

export const esquemaListadoUsuarios = z.object({
  q: z.string().trim().max(100).optional(),
  limite: z.coerce.number().int().min(1).max(100).default(50),
  desde: z.coerce.number().int().min(0).default(0),
});

export type EntradaRegistro = z.infer<typeof esquemaRegistro>;
export type EntradaLogin = z.infer<typeof esquemaLogin>;
