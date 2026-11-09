import { errorNoEncontrado, errorProhibido } from '../dominio/errores.js';
import type { Pedido } from '../dominio/pedido.js';
import {
  esDuenoOSuperadmin,
  type ContextoAutenticacion,
} from '../dominio/usuario.js';
import type { PedidosRepositorio } from '../puertos/pedidos.repositorio.js';
import type { RestaurantesCliente } from '../puertos/restaurantes.cliente.js';

interface Dependencias {
  pedidos: PedidosRepositorio;
  restaurantes: RestaurantesCliente;
}

/** Caso de uso: historial del comensal autenticado. */
export const listarPedidosMios =
  ({ pedidos }: Dependencias) =>
  (usuario: ContextoAutenticacion): Promise<Pedido[]> =>
    pedidos.listarPorUsuario(usuario.usuarioId);

/** Caso de uso: bandeja del dueño para un restaurante. */
export const listarPedidosPorRestaurante =
  ({ pedidos, restaurantes }: Dependencias) =>
  async (
    usuario: ContextoAutenticacion,
    restauranteId: string,
    token: string,
  ): Promise<Pedido[]> => {
    if (!esDuenoOSuperadmin(usuario)) {
      throw errorProhibido('Solo el dueño del restaurante puede ver estos pedidos.');
    }
    if (usuario.rol === 'dueno') {
      await restaurantes.verificarPropietario(restauranteId, token);
    }
    return pedidos.listarPorRestaurante(restauranteId);
  };

/** Caso de uso: detalle de un pedido para su autor o para el restaurante. */
export const obtenerPedido =
  ({ pedidos, restaurantes }: Dependencias) =>
  async (
    usuario: ContextoAutenticacion,
    pedidoId: string,
    token: string,
  ): Promise<Pedido> => {
    const pedido = await pedidos.buscarPorId(pedidoId);
    if (!pedido) throw errorNoEncontrado('No encontramos el pedido.');
    if (pedido.usuarioId === usuario.usuarioId) return pedido;

    if (!esDuenoOSuperadmin(usuario)) {
      throw errorProhibido('Solo el dueño del restaurante puede ver estos pedidos.');
    }
    if (usuario.rol === 'dueno') {
      await restaurantes.verificarPropietario(pedido.restauranteId, token);
    }
    return pedido;
  };
