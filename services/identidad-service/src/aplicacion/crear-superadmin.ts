import type {
  EntradaCrearSuperadmin,
  Rol,
  UsuarioPublico,
} from '../dominio/usuario.js';
import type { DependenciasIdentidad } from './dependencias.js';

/**
 * Caso de uso: crear o actualizar el superadmin inicial.
 *
 * Solo lo usa el script de arranque; no existe una ruta pública que permita
 * asignar este rol.
 */
export const crearSuperadmin =
  ({ usuarios, hasher }: DependenciasIdentidad) =>
  async (entrada: EntradaCrearSuperadmin): Promise<UsuarioPublico> => {
    const existente = await usuarios.buscarPorEmail(entrada.email);
    const passwordHash = await hasher.hashear(entrada.password);

    if (existente) {
      await usuarios.actualizarCredenciales({
        usuarioId: existente.id,
        passwordHash,
        rol: 'superadmin' as Rol,
      });
      const { passwordHash: _passwordHash, ...publico } = existente;
      return { ...publico, rol: 'superadmin' as Rol };
    }

    return usuarios.crearUsuario({
      email: entrada.email,
      passwordHash,
      nombre: entrada.nombre ?? 'Super',
      apellido: entrada.apellido ?? 'Admin',
      rol: 'superadmin',
    });
  };
