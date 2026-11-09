import type { FiltrosUsuarios } from '../dominio/usuario.js';
import type { ResultadoListadoUsuarios } from '../puertos/usuarios.repositorio.js';
import type { DependenciasIdentidad } from './dependencias.js';

/** Caso de uso: listado de cuentas para el panel de administración. */
export const listarUsuarios =
  ({ usuarios }: DependenciasIdentidad) =>
  (filtros: FiltrosUsuarios): Promise<ResultadoListadoUsuarios> =>
    usuarios.listarUsuarios(filtros);
