import type {
  ContextoAutenticacion,
  ContextoPeticion,
} from '../dominio/usuario.js';

/** Token de refresco recién generado; el hash es lo que se persiste. */
export interface RefreshCreado {
  token: string;
  hash: string;
  expiraEn: Date;
}

/**
 * Puerto de tokens de sesión. La aplicación no sabe si se firman con `jose`,
 * con otro algoritmo o con un doble de prueba.
 */
export interface TokensSesion {
  firmarAcceso(usuario: ContextoAutenticacion): Promise<string>;
  verificarAcceso(token: string): Promise<ContextoAutenticacion>;
  crearRefreshToken(): RefreshCreado;
  hashearToken(token: string): string;
}

export type { ContextoPeticion };
