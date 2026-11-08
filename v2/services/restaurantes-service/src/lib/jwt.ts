import { jwtVerify } from 'jose';
import { config } from '../config.js';
import type { ContextoAutenticacion } from '../modulos/restaurantes/restaurantes.types.js';

/**
 * Verificación del JWT emitido por identidad.
 *
 * El servicio no consulta la base de identidad: confía en la firma y en la
 * audiencia del token. La autorización por recurso se valida después.
 */
const secreto = new TextEncoder().encode(config.JWT_SECRETO);

export const verificarAcceso = async (token: string): Promise<ContextoAutenticacion> => {
  const { payload } = await jwtVerify(token, secreto, {
    issuer: config.JWT_EMISOR,
    audience: config.JWT_AUDIENCIA,
  });

  const usuarioId = String(payload.sub ?? '');
  const rol = String(payload.rol ?? '');
  const email = String(payload.email ?? '');
  if (!usuarioId || !rol || !email) {
    throw new Error('Token sin los campos obligatorios.');
  }

  return { usuarioId, rol: rol as ContextoAutenticacion['rol'], email };
};
