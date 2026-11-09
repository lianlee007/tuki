import type { EntradaResena, Resena } from '../dominio/resena.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { ResenasRepositorio } from '../puertos/resenas.repositorio.js';
import type { RestaurantesCliente } from '../puertos/restaurantes.cliente.js';

interface Dependencias {
  resenas: ResenasRepositorio;
  restaurantes: RestaurantesCliente;
}

/**
 * Caso de uso: publicar una reseña.
 *
 * Comprueba que el restaurante exista y normaliza los opcionales antes de
 * guardar.
 */
export const crearResena =
  ({ resenas, restaurantes }: Dependencias) =>
  async (
    usuario: ContextoAutenticacion,
    entrada: EntradaResena,
  ): Promise<Resena> => {
    await restaurantes.verificarRestaurante(entrada.restauranteId);
    return resenas.crear({
      ...entrada,
      usuarioId: usuario.usuarioId,
      platilloId: entrada.platilloId ?? null,
      comentario: entrada.comentario ?? null,
      fotoUrl: entrada.fotoUrl ?? null,
    });
  };
