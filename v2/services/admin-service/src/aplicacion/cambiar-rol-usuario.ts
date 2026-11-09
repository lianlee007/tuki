import type { UsuarioAdmin } from '../dominio/admin.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { AuditoriaRepositorio } from '../puertos/auditoria.repositorio.js';
import type { ServiciosRemotos } from '../puertos/servicios.remotos.js';

interface Dependencias {
  remotos: ServiciosRemotos;
  auditoria: AuditoriaRepositorio;
}

/** Caso de uso: cambiar el rol de una cuenta y auditarlo. */
export const cambiarRolUsuario =
  ({ remotos, auditoria }: Dependencias) =>
  async (
    usuario: ContextoAutenticacion,
    token: string,
    usuarioId: string,
    rol: string,
  ): Promise<UsuarioAdmin> => {
    const respuesta = await remotos.cambiarRol(token, usuarioId, rol);
    await auditoria.registrar({
      actorId: usuario.usuarioId,
      accion: 'cambiar_rol',
      entidad: 'usuario',
      entidadId: usuarioId,
      detalle: { rol },
    });
    return respuesta.usuario;
  };
