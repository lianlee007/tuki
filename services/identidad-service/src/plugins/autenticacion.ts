import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { errorNoAutorizado, errorProhibido } from '../dominio/errores.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { TokensSesion } from '../puertos/tokens-sesion.js';

declare module 'fastify' {
  interface FastifyRequest {
    usuario: ContextoAutenticacion | null;
  }
  interface FastifyInstance {
    autenticar: preHandlerHookHandler;
  }
}

/** Exige una sesión válida y uno de los roles indicados. */
export const exigirRol =
  (...roles: string[]) =>
  async (request: FastifyRequest): Promise<void> => {
    if (!request.usuario) throw errorNoAutorizado('Inicia sesión para continuar.');
    if (roles.length > 0 && !roles.includes(request.usuario.rol)) {
      throw errorProhibido('Tu cuenta no tiene permiso para esta acción.');
    }
  };

/**
 * Autenticación por Bearer token.
 *
 * Los servicios no consultan la base de identidad en cada petición: validan la
 * firma del JWT. La revocación inmediata se resuelve con la vida corta del
 * token de acceso y la rotación del refresco.
 */
export default fp<{ tokens: TokensSesion }>(async (app, opciones) => {
  app.decorateRequest('usuario', null);

  app.decorate('autenticar', async (request: FastifyRequest) => {
    const encabezado = request.headers.authorization;
    if (!encabezado?.startsWith('Bearer ')) {
      throw errorNoAutorizado('Falta el token de acceso.');
    }

    const token = encabezado.slice('Bearer '.length).trim();
    if (!token) throw errorNoAutorizado('El token de acceso está vacío.');

    try {
      request.usuario = await opciones.tokens.verificarAcceso(token);
    } catch {
      throw errorNoAutorizado('La sesión no es válida o expiró.');
    }
  });
});
