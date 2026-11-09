import { z } from 'zod';

/** Contratos de entrada del servicio de reseñas. */
export const esquemaCrear = z.object({
  restauranteId: z.string().uuid(),
  platilloId: z.string().uuid().nullable().optional(),
  nombreCliente: z.string().trim().min(2).max(80),
  calificacion: z.coerce.number().int().min(1).max(5),
  comentario: z.string().trim().max(500).optional(),
  fotoUrl: z.string().trim().url().max(500).nullable().optional(),
});

export const esquemaRespuesta = z.object({
  respuesta: z.string().trim().min(2).max(500),
});

export const esquemaVisible = z.object({
  visible: z.boolean(),
});

export type EntradaCrearResena = z.infer<typeof esquemaCrear>;
