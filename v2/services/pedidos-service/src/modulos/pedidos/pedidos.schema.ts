import { z } from 'zod';

/** Contratos de entrada del servicio de pedidos. */
const item = z.object({
  platilloId: z.string().uuid(),
  cantidad: z.coerce.number().int().min(1).max(20),
  notas: z.string().trim().max(200).optional(),
});

export const esquemaCrearPedido = z
  .object({
    restauranteId: z.string().uuid(),
    items: z.array(item).min(1).max(50),
    tipoPedido: z.enum(['entrega', 'recoger']).default('entrega'),
    nombreCliente: z.string().trim().min(2).max(80),
    telefonoCliente: z
      .string()
      .trim()
      .min(7)
      .max(20)
      .regex(/^[0-9+\s()-]+$/, 'El teléfono no tiene un formato válido.'),
    direccionEntrega: z.string().trim().max(200).optional(),
    notasCliente: z.string().trim().max(300).optional(),
  })
  .superRefine((datos, contexto) => {
    if (datos.tipoPedido === 'entrega' && !datos.direccionEntrega) {
      contexto.addIssue({
        code: 'custom',
        path: ['direccionEntrega'],
        message: 'La dirección es obligatoria para un pedido a domicilio.',
      });
    }
  });

export const esquemaEstado = z.object({
  estado: z.enum(['pendiente', 'confirmado', 'en_camino', 'entregado', 'cancelado']),
});

export type EntradaPedidoValidada = z.infer<typeof esquemaCrearPedido>;
