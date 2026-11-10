import type { DependenciasIdentidad } from './dependencias.js';

/** Caso de uso: cerrar la sesión del dispositivo actual. */
export const cerrarSesion =
  ({ usuarios, tokens }: DependenciasIdentidad) =>
  async (refreshToken: string): Promise<void> => {
    await usuarios.revocarRefreshToken(tokens.hashearToken(refreshToken));
  };
