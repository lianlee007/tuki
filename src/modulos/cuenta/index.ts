/**
 * API pública del módulo `cuenta`.
 *
 * Agrupa las reglas de los datos de envío, el repositorio de la fila `users` y
 * el hook que comparten «Mi cuenta», el registro y los carritos.
 */
export * from './dominio/datosEnvio';
export { apiCuenta } from './infraestructura/apiCuenta';
export { useDatosEnvio, type EstadoDatosEnvio } from './aplicacion/useDatosEnvio';
