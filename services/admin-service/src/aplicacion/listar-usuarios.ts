import type { FiltrosListado } from '../dominio/admin.js';
import type {
  ListadoUsuarios,
  ServiciosRemotos,
} from '../puertos/servicios.remotos.js';

/** Caso de uso: cuentas con búsqueda y paginación. */
export const listarUsuarios =
  ({ remotos }: { remotos: ServiciosRemotos }) =>
  (token: string, filtros: FiltrosListado): Promise<ListadoUsuarios> =>
    remotos.listarUsuarios(token, filtros);
