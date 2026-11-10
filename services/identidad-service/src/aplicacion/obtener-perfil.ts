import { errorNoEncontrado } from '../dominio/errores.js';
import type { UsuarioPublico } from '../dominio/usuario.js';
import type { DependenciasIdentidad } from './dependencias.js';

/** Caso de uso: perfil de la cuenta autenticada. */
export const obtenerPerfil =
  ({ usuarios }: DependenciasIdentidad) =>
  async (usuarioId: string): Promise<UsuarioPublico> => {
    const usuario = await usuarios.buscarPorId(usuarioId);
    if (!usuario) throw errorNoEncontrado('No encontramos la cuenta.');
    return usuario;
  };
