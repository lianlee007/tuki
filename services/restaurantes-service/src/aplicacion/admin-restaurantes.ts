import { errorNoEncontrado } from '../dominio/errores.js';
import type { FiltrosAdmin } from '../dominio/restaurante.js';
import type { DependenciasRestaurantes } from './dependencias.js';

/** Caso de uso: listado administrativo con el dueño incluido. */
export const listarTodosAdmin =
  ({ restaurantes }: DependenciasRestaurantes) =>
  (filtros: FiltrosAdmin) =>
    restaurantes.listarTodos(filtros);

/** Caso de uso: resumen de locales para el panorama. */
export const resumenAdmin =
  ({ restaurantes }: DependenciasRestaurantes) =>
  () =>
    restaurantes.resumen();

/** Caso de uso: suspender o reactivar un local. */
export const cambiarActivo =
  ({ restaurantes }: DependenciasRestaurantes) =>
  async (id: string, activo: boolean) => {
    const fila = await restaurantes.cambiarActivo(id, activo);
    if (!fila) throw errorNoEncontrado('No encontramos el restaurante.');
    return fila;
  };
