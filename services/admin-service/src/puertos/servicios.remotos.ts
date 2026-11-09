import type {
  FiltrosListado,
  Panorama,
  RestauranteAdmin,
  UsuarioAdmin,
} from '../dominio/admin.js';

export interface ListadoRestaurantes {
  items: RestauranteAdmin[];
  total: number;
}

export interface ListadoUsuarios {
  items: UsuarioAdmin[];
  total: number;
}

/**
 * Puerto de lectura/acción sobre los servicios de negocio. El BFF no sabe si
 * detrás hay HTTP, gRPC o dobles de prueba.
 */
export interface ServiciosRemotos {
  panorama(token: string): Promise<Panorama>;
  listarRestaurantes(
    token: string,
    filtros: FiltrosListado,
  ): Promise<ListadoRestaurantes>;
  cambiarEstado(
    token: string,
    restauranteId: string,
    activo: boolean,
  ): Promise<RestauranteAdmin>;
  listarUsuarios(token: string, filtros: FiltrosListado): Promise<ListadoUsuarios>;
  cambiarRol(
    token: string,
    usuarioId: string,
    rol: string,
  ): Promise<{ usuario: UsuarioAdmin }>;
}
