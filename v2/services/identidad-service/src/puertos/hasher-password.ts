/** Puerto de hash de contraseñas. Argon2 es un detalle del adaptador. */
export interface HasherPassword {
  hashear(password: string): Promise<string>;
  verificar(hash: string, password: string): Promise<boolean>;
}
