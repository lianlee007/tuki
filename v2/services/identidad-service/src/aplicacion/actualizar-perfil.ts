import { errorNoEncontrado } from '../dominio/errores.js';
import type {
  ContextoAutenticacion,
  EntradaActualizarPerfil,
  UsuarioPublico,
} from '../dominio/usuario.js';
import type { DependenciasIdentidad } from './dependencias.js';

/** Caso de uso: actualizar nombre, apellido o foto de la propia cuenta. */
export const actualizarPerfil =
  ({ usuarios }: DependenciasIdentidad) =>
  async (
    usuario: ContextoAutenticacion,
    entrada: EntradaActualizarPerfil,
  ): Promise<UsuarioPublico> => {
    const actualizado = await usuarios.actualizarPerfil({
      usuarioId: usuario.usuarioId,
      ...entrada,
    });
    if (!actualizado) throw errorNoEncontrado('No encontramos la cuenta.');
    return actualizado;
  };
