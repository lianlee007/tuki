import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { config } from '../config.js';
import type { ContextoAutenticacion } from '../modulos/identidad/identidad.types.js';

/**
 * Tokens de la sesión.
 *
 * - El acceso es un JWT corto que los demás servicios validan sin consultar la
 *   base de identidad.
 * - El refresco es opaco y se guarda como hash: si la base se filtra, los
 *   tokens no se pueden reutilizar.
 */
const secreto = new TextEncoder().encode(config.JWT_SECRETO);
const VIDA_ACCESO = '15m';
const VIDA_REFRESCO_DIAS = 30;

export const firmarAcceso = async (usuario: ContextoAutenticacion): Promise<string> =>
  new SignJWT({ rol: usuario.rol, email: usuario.email })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(usuario.usuarioId)
    .setIssuer(config.JWT_EMISOR)
    .setAudience(config.JWT_AUDIENCIA)
    .setIssuedAt()
    .setExpirationTime(VIDA_ACCESO)
    .sign(secreto);

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

export const crearRefreshToken = () => {
  const token = randomBytes(48).toString('base64url');
  const expiraEn = new Date(Date.now() + VIDA_REFRESCO_DIAS * 24 * 60 * 60 * 1000);
  return { token, hash: hashearToken(token), expiraEn };
};

export const hashearToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
