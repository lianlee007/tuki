import argon2, { type Options } from 'argon2';

/**
 * Contraseñas con Argon2id.
 *
 * Los parámetros son los recomendados por OWASP para un servicio interactivo:
 * memoria moderada y tres iteraciones. El hash incluye su propia sal.
 */
const OPCIONES: Options = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 3,
  parallelism: 1,
};

export const hashearPassword = (password: string): Promise<string> =>
  argon2.hash(password, OPCIONES);

export const verificarPassword = (hash: string, password: string): Promise<boolean> =>
  argon2.verify(hash, password).catch(() => false);
