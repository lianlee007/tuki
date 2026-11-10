import type { Rol } from '../dominio/usuario.js';
import type { DependenciasIdentidad } from './dependencias.js';

/** Caso de uso: conteo de cuentas por rol. */
export const resumenUsuarios =
  ({ usuarios }: DependenciasIdentidad) =>
  (): Promise<Record<Rol, number>> =>
    usuarios.resumenUsuarios();
