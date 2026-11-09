import { errorNoEncontrado, errorProhibido } from '../dominio/errores.js';
import { puedeResponder, type Resena } from '../dominio/resena.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { ResenasRepositorio } from '../puertos/resenas.repositorio.js';
import type { RestaurantesCliente } from '../puertos/restaurantes.cliente.js';

interface Dependencias {
  resenas: ResenasRepositorio;
  restaurantes: RestaurantesCliente;
}

const exigirDueno = async (
  dependencias: Dependencias,
  usuario: ContextoAutenticacion,
  restauranteId: string,
  token: string,
) => {
  if (!puedeResponder(usuario)) {
    throw errorProhibido('Solo el dueño puede responder una reseña.');
  }
  if (usuario.rol === 'dueno') {
    await dependencias.restaurantes.verificarPropietario(restauranteId, token);
  }
};

/** Caso de uso: el dueño responde públicamente una reseña. */
export const responderResena =
  (dependencias: Dependencias) =>
  async (
    usuario: ContextoAutenticacion,
    id: string,
    respuesta: string,
    token: string,
  ): Promise<Resena | null> => {
    const resena = await dependencias.resenas.buscarPorId(id);
    if (!resena) throw errorNoEncontrado('No encontramos la reseña.');
    await exigirDueno(dependencias, usuario, resena.restauranteId, token);
    return dependencias.resenas.responder(id, respuesta);
  };

/** Caso de uso: borra la respuesta del dueño sin eliminar la reseña. */
export const borrarRespuestaResena =
  (dependencias: Dependencias) =>
  async (
    usuario: ContextoAutenticacion,
    id: string,
    token: string,
  ): Promise<Resena | null> => {
    const resena = await dependencias.resenas.buscarPorId(id);
    if (!resena) throw errorNoEncontrado('No encontramos la reseña.');
    await exigirDueno(dependencias, usuario, resena.restauranteId, token);
    return dependencias.resenas.borrarRespuesta(id);
  };
