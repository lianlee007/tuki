import type { PedidosRepositorio, ResumenPedidos } from '../puertos/pedidos.repositorio.js';

/** Caso de uso: totales globales para el panel de administración. */
export const resumenAdmin =
  ({ pedidos }: { pedidos: PedidosRepositorio }) =>
  (): Promise<ResumenPedidos> =>
    pedidos.resumen();
