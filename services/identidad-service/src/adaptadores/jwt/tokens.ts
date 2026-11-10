import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { config } from '../../config.js';
import type { ContextoAutenticacion } from '../../dominio/usuario.js';
import type {
  RefreshCreado,
  TokensSesion,
} from '../../puertos/tokens-sesion.js';

const secreto = new TextEncoder().encode(config.JWT_SECRETO);
const VIDA_ACCESO = '15m';
const VIDA_REFRESCO_DIAS = 30;

const hashearToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

/** Adaptador JWT + refresh opaco del puerto `TokensSesion`. */
export const crearTokensSesion = (): TokensSesion => ({
  firmarAcceso: async (usuario: ContextoAutenticacion): Promise<string> =>
    new SignJWT({ rol: usuario.rol, email: usuario.email })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(usuario.usuarioId)
      .setIssuer(config.JWT_EMISOR)
      .setAudience(config.JWT_AUDIENCIA)
      .setIssuedAt()
      .setExpirationTime(VIDA_ACCESO)
      .sign(secreto),

  verificarAcceso: async (token: string): Promise<ContextoAutenticacion> => {
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
  },

  crearRefreshToken: (): RefreshCreado => {
    const token = randomBytes(48).toString('base64url');
    const expiraEn = new Date(
      Date.now() + VIDA_REFRESCO_DIAS * 24 * 60 * 60 * 1000,
    );
    return { token, hash: hashearToken(token), expiraEn };
  },

  hashearToken,
});
