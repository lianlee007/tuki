import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { errorNoAutorizado } from '../lib/errores.js';
import { verificarAcceso } from '../lib/tokens.js';
import type { ContextoAutenticacion } from '../modulos/identidad/identidad.types.js';

declare module 'fastify' {
  interface FastifyRequest {
    usuario: ContextoAutenticacion | null;
  }
  interface FastifyInstance {
    autenticar: preHandlerHookHandler;
  }
}

/**
 * Autenticación por Bearer token.
 *
 * Los servicios no consultan la base de identidad en cada petición: validan la
 * firma del JWT. La revocación inmediata se resuelve con la vida corta del
 * token de acceso y la rotación del refresco.
 */
export default fp(async (app: FastifyInstance) => {
  app.decorateRequest('usuario', null);

  app.decorate('autenticar', async (request: FastifyRequest) => {
    const encabezado = request.headers.authorization;
    if (!encabezado?.startsWith('Bearer ')) {
      throw errorNoAutorizado('Falta el token de acceso.');
    }

    const token = encabezado.slice('Bearer '.length).trim();
    if (!token) throw errorNoAutorizado('El token de acceso está vacío.');

    try {
      request.usuario = await verificarAcceso(token);
    } catch {
      throw errorNoAutorizado('La sesión no es válida o expiró.');
    }
  });
});
