import { jwtVerify } from 'jose';
import { config } from '../../config.js';
import type { ContextoAutenticacion } from '../../dominio/usuario.js';

/** Verifica el JWT emitido por identidad-service. */
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
