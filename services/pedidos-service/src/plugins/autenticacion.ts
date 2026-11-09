import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { verificarAcceso } from '../adaptadores/auth/jwt.js';
import { errorNoAutorizado, errorProhibido } from '../dominio/errores.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';

declare module 'fastify' {
  interface FastifyRequest {
    usuario: ContextoAutenticacion | null;
  }
  interface FastifyInstance {
    autenticar: preHandlerHookHandler;
  }
}

/** Exige una sesión válida y, opcionalmente, uno de los roles indicados. */
export const exigirRol =
  (...roles: string[]) =>
  async (request: FastifyRequest): Promise<void> => {
    if (!request.usuario) throw errorNoAutorizado('Inicia sesión para continuar.');
    if (roles.length > 0 && !roles.includes(request.usuario.rol)) {
      throw errorProhibido('Tu cuenta no tiene permiso para esta acción.');
    }
  };

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
