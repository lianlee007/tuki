import { z } from 'zod';
import { DESTINOS } from '../../dominio/media.js';

/** Contrato de entrada del servicio de medios. */
export const esquemaDestino = z.object({
  destino: z.enum(DESTINOS),
});
