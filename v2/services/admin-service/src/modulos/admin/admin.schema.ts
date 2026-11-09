import { z } from 'zod';

export const esquemaListado = z.object({
  q: z.string().trim().max(100).optional(),
  limite: z.coerce.number().int().min(1).max(100).default(50),
  desde: z.coerce.number().int().min(0).default(0),
});

export const esquemaEstado = z.object({
  activo: z.boolean(),
});

export const esquemaRol = z.object({
  rol: z.enum(['cliente', 'dueno', 'superadmin']),
});
