import { errorConflicto } from '../dominio/errores.js';
import type {
  ContextoPeticion,
  EntradaRegistro,
  SesionCreada,
} from '../dominio/usuario.js';
import { crearSesion } from './crear-sesion.js';
import type { DependenciasIdentidad } from './dependencias.js';

/** Caso de uso: registro público. Solo permite cliente y dueño. */
export const registrar =
  (dependencias: DependenciasIdentidad) =>
  async (
    entrada: EntradaRegistro,
    contexto: ContextoPeticion,
  ): Promise<SesionCreada> => {
    const existente = await dependencias.usuarios.buscarPorEmail(entrada.email);
    if (existente) throw errorConflicto('Ese correo ya tiene una cuenta.');

    const passwordHash = await dependencias.hasher.hashear(entrada.password);
    const usuario = await dependencias.usuarios.crearUsuario({
      email: entrada.email,
      passwordHash,
      nombre: entrada.nombre,
      apellido: entrada.apellido,
      rol: entrada.rol,
    });

    await dependencias.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'registro',
      detalle: { rol: usuario.rol },
    });

    return crearSesion(dependencias, usuario, contexto);
  };
