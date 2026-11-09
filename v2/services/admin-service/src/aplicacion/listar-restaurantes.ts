import type { FiltrosListado } from '../dominio/admin.js';
import type {
  ListadoRestaurantes,
  ServiciosRemotos,
} from '../puertos/servicios.remotos.js';

/** Caso de uso: locales con búsqueda y paginación. */
export const listarRestaurantes =
  ({ remotos }: { remotos: ServiciosRemotos }) =>
  (token: string, filtros: FiltrosListado): Promise<ListadoRestaurantes> =>
    remotos.listarRestaurantes(token, filtros);
