/**
 * API pública del módulo `menu`.
 *
 * Dueño de platillos, categorías, el restaurante y su tema. Expone las reglas
 * del estado del platillo, los repositorios de Supabase y el hook del panel.
 */
export * from './dominio/estadoPlatillo';
export { apiPlatillos } from './infraestructura/apiPlatillos';
export { apiRestaurante } from './infraestructura/apiRestaurante';
export { useDatosPanel } from './aplicacion/useDatosPanel';
