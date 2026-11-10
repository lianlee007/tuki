import type {
  ContextoPeticion,
  SesionCreada,
  UsuarioPublico,
} from '../dominio/usuario.js';
import { aUsuarioPublico } from '../dominio/usuario.js';
import type { DependenciasIdentidad } from './dependencias.js';

/**
 * Crea una sesión completa: access token, refresh opaco y registro del
 * dispositivo. El refresco se guarda como hash, nunca en claro.
 */
export const crearSesion = async (
  { usuarios, tokens }: DependenciasIdentidad,
  usuario: UsuarioPublico,
  contexto: ContextoPeticion,
): Promise<SesionCreada> => {
  const refresco = tokens.crearRefreshToken();
  await usuarios.guardarRefreshToken({
    usuarioId: usuario.id,
    tokenHash: refresco.hash,
    expiraEn: refresco.expiraEn,
    userAgent: contexto.userAgent,
    ip: contexto.ip,
  });

  const accessToken = await tokens.firmarAcceso({
    usuarioId: usuario.id,
    rol: usuario.rol,
    email: usuario.email,
  });

  return {
    usuario: aUsuarioPublico(usuario),
    accessToken,
    refreshToken: refresco.token,
    refreshExpiraEn: refresco.expiraEn,
  };
};
