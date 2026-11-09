import { errorNoAutorizado } from '../dominio/errores.js';
import type {
  ContextoPeticion,
  EntradaLogin,
  SesionCreada,
} from '../dominio/usuario.js';
import { crearSesion } from './crear-sesion.js';
import type { DependenciasIdentidad } from './dependencias.js';

/** Caso de uso: inicio de sesión con correo y contraseña. */
export const iniciarSesion =
  (dependencias: DependenciasIdentidad) =>
  async (
    entrada: EntradaLogin,
    contexto: ContextoPeticion,
  ): Promise<SesionCreada> => {
    const usuario = await dependencias.usuarios.buscarPorEmail(entrada.email);
    const valida = usuario
      ? await dependencias.hasher.verificar(usuario.passwordHash, entrada.password)
      : false;

    if (!usuario || !valida) {
      await dependencias.auditoria.registrar({
        accion: 'login_fallido',
        detalle: { email: entrada.email },
      });
      throw errorNoAutorizado('Correo o contraseña incorrectos.');
    }

    await dependencias.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'login',
    });

    return crearSesion(dependencias, usuario, contexto);
  };
