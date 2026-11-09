import { cambiarEstadoPedido } from './cambiar-estado.js';
import {
  listarPedidosMios,
  listarPedidosPorRestaurante,
  obtenerPedido,
} from './consultar-pedidos.js';
import { crearPedido } from './crear-pedido.js';
import { resumenAdmin } from './resumen-admin.js';
import type { PedidosRepositorio } from '../puertos/pedidos.repositorio.js';
import type { RestaurantesCliente } from '../puertos/restaurantes.cliente.js';

interface Dependencias {
  pedidos: PedidosRepositorio;
  restaurantes: RestaurantesCliente;
}

/** Contrato que consume la capa HTTP. */
export interface CasosDeUsoPedidos {
  crear: ReturnType<typeof crearPedido>;
  mios: ReturnType<typeof listarPedidosMios>;
  porRestaurante: ReturnType<typeof listarPedidosPorRestaurante>;
  obtener: ReturnType<typeof obtenerPedido>;
  cambiarEstado: ReturnType<typeof cambiarEstadoPedido>;
  resumenAdmin: ReturnType<typeof resumenAdmin>;
}

/** Raíz de composición: une casos de uso con adaptadores concretos. */
export const crearCasosDeUsoPedidos = (
  dependencias: Dependencias,
): CasosDeUsoPedidos => ({
  crear: crearPedido(dependencias),
  mios: listarPedidosMios(dependencias),
  porRestaurante: listarPedidosPorRestaurante(dependencias),
  obtener: obtenerPedido(dependencias),
  cambiarEstado: cambiarEstadoPedido(dependencias),
  resumenAdmin: resumenAdmin(dependencias),
});
