import { errorNoAutorizado } from '../dominio/errores.js';
import type { ContextoPeticion, SesionCreada } from '../dominio/usuario.js';
import { crearSesion } from './crear-sesion.js';
import type { DependenciasIdentidad } from './dependencias.js';

/** Caso de uso: rotar el refresh token e invalidar el anterior. */
export const refrescar =
  (dependencias: DependenciasIdentidad) =>
  async (
    refreshToken: string,
    contexto: ContextoPeticion,
  ): Promise<SesionCreada> => {
    const hash = dependencias.tokens.hashearToken(refreshToken);
    const vigente = await dependencias.usuarios.buscarRefreshVigente(hash);
    if (!vigente) {
      throw errorNoAutorizado('La sesión expiró. Vuelve a iniciar sesión.');
    }

    await dependencias.usuarios.revocarRefreshToken(hash);
    return crearSesion(dependencias, vigente.usuario, contexto);
  };
