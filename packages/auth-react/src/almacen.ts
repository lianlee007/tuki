const CLAVE_ACCESO = 'tuki.access';
const CLAVE_REFRESCO = 'tuki.refresh';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Almacenamiento local de la sesión.
 *
 * Para el alcance escolar se usa localStorage. En producción debe migrarse a
 * cookie httpOnly con refresh rotativo para reducir el riesgo de XSS.
 */
export const guardarTokens = (tokens: Tokens): void => {
  localStorage.setItem(CLAVE_ACCESO, tokens.accessToken);
  localStorage.setItem(CLAVE_REFRESCO, tokens.refreshToken);
};

export const leerTokens = (): Partial<Tokens> => ({
  accessToken: localStorage.getItem(CLAVE_ACCESO) ?? undefined,
  refreshToken: localStorage.getItem(CLAVE_REFRESCO) ?? undefined,
});

export const limpiarTokens = (): void => {
  localStorage.removeItem(CLAVE_ACCESO);
  localStorage.removeItem(CLAVE_REFRESCO);
};
