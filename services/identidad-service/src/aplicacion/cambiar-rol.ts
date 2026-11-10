import { errorNoEncontrado } from '../dominio/errores.js';
import type { Rol, UsuarioPublico } from '../dominio/usuario.js';
import type { DependenciasIdentidad } from './dependencias.js';

/** Caso de uso: cambiar el rol y dejar rastro en auditoría. */
export const cambiarRol =
  ({ usuarios, auditoria }: DependenciasIdentidad) =>
  async (id: string, rol: Rol): Promise<UsuarioPublico> => {
    const usuario = await usuarios.cambiarRol(id, rol);
    if (!usuario) throw errorNoEncontrado('No encontramos la cuenta.');
    await auditoria.registrar({
      usuarioId: id,
      accion: 'cambio_rol',
      detalle: { rol },
    });
    return usuario;
  };
