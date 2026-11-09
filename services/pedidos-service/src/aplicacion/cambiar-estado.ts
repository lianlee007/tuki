import {
  errorNoEncontrado,
  errorProhibido,
  errorValidacion,
} from '../dominio/errores.js';
import {
  esTransicionValida,
  type EstadoPedido,
  type Pedido,
} from '../dominio/pedido.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { PedidosRepositorio } from '../puertos/pedidos.repositorio.js';
import type { RestaurantesCliente } from '../puertos/restaurantes.cliente.js';
import { obtenerPedido } from './consultar-pedidos.js';

interface Dependencias {
  pedidos: PedidosRepositorio;
  restaurantes: RestaurantesCliente;
}

/** Caso de uso: avanzar o cancelar un pedido respetando la máquina de estados. */
export const cambiarEstadoPedido =
  (dependencias: Dependencias) => {
    const obtener = obtenerPedido(dependencias);

    return async (
      usuario: ContextoAutenticacion,
      pedidoId: string,
      estado: EstadoPedido,
      token: string,
    ): Promise<Pedido> => {
      const pedido = await obtener(usuario, pedidoId, token);

      if (pedido.usuarioId === usuario.usuarioId && usuario.rol === 'cliente') {
        throw errorProhibido('Solo el restaurante puede cambiar el estado.');
      }
      if (!esTransicionValida(pedido.estado, estado)) {
        throw errorValidacion('El cambio de estado no es válido.');
      }

      const actualizado = await dependencias.pedidos.actualizarEstado(pedidoId, estado);
      if (!actualizado) throw errorNoEncontrado('No encontramos el pedido.');
      return actualizado;
    };
  };
