/**
 * API pública del módulo `pedidos`.
 *
 * El resto de la aplicación importa desde aquí, nunca desde
 * `modulos/pedidos/dominio/...` ni `.../infraestructura/...`. Así se puede
 * cambiar la persistencia o partir el módulo en un servicio sin tocar a los
 * consumidores.
 */
export * from './dominio/pedido';
export * from './dominio/carrito';
export { apiPedidos } from './infraestructura/apiPedidos';
export { almacenamientoCarrito } from './infraestructura/almacenamientoCarrito';
export { useStoreCarrito } from './aplicacion/storeCarrito';
