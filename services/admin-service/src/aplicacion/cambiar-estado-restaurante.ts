import { accionDeEstado, type RestauranteAdmin } from '../dominio/admin.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { AuditoriaRepositorio } from '../puertos/auditoria.repositorio.js';
import type { ServiciosRemotos } from '../puertos/servicios.remotos.js';

interface Dependencias {
  remotos: ServiciosRemotos;
  auditoria: AuditoriaRepositorio;
}

/**
 * Caso de uso: suspender o reactivar un local y dejar rastro en la auditoría.
 */
export const cambiarEstadoRestaurante =
  ({ remotos, auditoria }: Dependencias) =>
  async (
    usuario: ContextoAutenticacion,
    token: string,
    restauranteId: string,
    activo: boolean,
  ): Promise<RestauranteAdmin> => {
    const restaurante = await remotos.cambiarEstado(token, restauranteId, activo);
    await auditoria.registrar({
      actorId: usuario.usuarioId,
      accion: accionDeEstado(activo),
      entidad: 'restaurante',
      entidadId: restauranteId,
      detalle: { activo },
    });
    return restaurante;
  };
