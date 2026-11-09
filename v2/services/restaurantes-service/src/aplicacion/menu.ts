import { errorNoEncontrado } from '../dominio/errores.js';
import { exigirPropietario } from '../dominio/propiedad.js';
import type {
  EntradaActualizarCategoria,
  EntradaActualizarPlatillo,
  EntradaCategoria,
  EntradaPlatillo,
} from '../dominio/restaurante.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { DependenciasRestaurantes } from './dependencias.js';

const verificarDuenoDelLocal = async (
  { restaurantes }: DependenciasRestaurantes,
  usuario: ContextoAutenticacion,
  restauranteId: string,
) => {
  const fila = await restaurantes.buscarPorId(restauranteId);
  if (!fila) throw errorNoEncontrado('No encontramos el restaurante.');
  exigirPropietario(usuario, fila.duenoId);
};

export const listarCategorias =
  (dependencias: DependenciasRestaurantes) =>
  async (usuario: ContextoAutenticacion, restauranteId: string) => {
    await verificarDuenoDelLocal(dependencias, usuario, restauranteId);
    return dependencias.menu.listarCategorias(restauranteId);
  };

export const crearCategoria =
  (dependencias: DependenciasRestaurantes) =>
  async (
    usuario: ContextoAutenticacion,
    restauranteId: string,
    entrada: EntradaCategoria,
  ) => {
    await verificarDuenoDelLocal(dependencias, usuario, restauranteId);
    const creada = await dependencias.menu.crearCategoria(restauranteId, entrada);
    if (!creada) throw new Error('No se pudo crear la categoría.');
    return creada;
  };

export const actualizarCategoria =
  (dependencias: DependenciasRestaurantes) =>
  async (
    usuario: ContextoAutenticacion,
    restauranteId: string,
    categoriaId: string,
    entrada: EntradaActualizarCategoria,
  ) => {
    await verificarDuenoDelLocal(dependencias, usuario, restauranteId);
    const actualizada = await dependencias.menu.actualizarCategoria(
      restauranteId,
      categoriaId,
      entrada,
    );
    if (!actualizada) throw errorNoEncontrado('No encontramos la categoría.');
    return actualizada;
  };

export const eliminarCategoria =
  (dependencias: DependenciasRestaurantes) =>
  async (
    usuario: ContextoAutenticacion,
    restauranteId: string,
    categoriaId: string,
  ) => {
    await verificarDuenoDelLocal(dependencias, usuario, restauranteId);
    const eliminada = await dependencias.menu.eliminarCategoria(
      restauranteId,
      categoriaId,
    );
    if (!eliminada) throw errorNoEncontrado('No encontramos la categoría.');
  };

export const listarPlatillos =
  (dependencias: DependenciasRestaurantes) =>
  async (usuario: ContextoAutenticacion, restauranteId: string) => {
    await verificarDuenoDelLocal(dependencias, usuario, restauranteId);
    return dependencias.menu.listarPlatillos(restauranteId);
  };

export const crearPlatillo =
  (dependencias: DependenciasRestaurantes) =>
  async (
    usuario: ContextoAutenticacion,
    restauranteId: string,
    entrada: EntradaPlatillo,
  ) => {
    await verificarDuenoDelLocal(dependencias, usuario, restauranteId);
    const creado = await dependencias.menu.crearPlatillo(restauranteId, entrada);
    if (!creado) throw new Error('No se pudo crear el platillo.');
    return creado;
  };

export const actualizarPlatillo =
  (dependencias: DependenciasRestaurantes) =>
  async (
    usuario: ContextoAutenticacion,
    restauranteId: string,
    platilloId: string,
    entrada: EntradaActualizarPlatillo,
  ) => {
    await verificarDuenoDelLocal(dependencias, usuario, restauranteId);
    const actualizado = await dependencias.menu.actualizarPlatillo(
      restauranteId,
      platilloId,
      entrada,
    );
    if (!actualizado) throw errorNoEncontrado('No encontramos el platillo.');
    return actualizado;
  };

export const eliminarPlatillo =
  (dependencias: DependenciasRestaurantes) =>
  async (
    usuario: ContextoAutenticacion,
    restauranteId: string,
    platilloId: string,
  ) => {
    await verificarDuenoDelLocal(dependencias, usuario, restauranteId);
    const eliminado = await dependencias.menu.eliminarPlatillo(
      restauranteId,
      platilloId,
    );
    if (!eliminado) throw errorNoEncontrado('No encontramos el platillo.');
  };

export const cambiarDisponibilidad =
  (dependencias: DependenciasRestaurantes) =>
  async (
    usuario: ContextoAutenticacion,
    restauranteId: string,
    platilloId: string,
    disponible: boolean,
  ) => {
    await verificarDuenoDelLocal(dependencias, usuario, restauranteId);
    const actualizado = await dependencias.menu.cambiarDisponibilidad(
      restauranteId,
      platilloId,
      disponible,
    );
    if (!actualizado) throw errorNoEncontrado('No encontramos el platillo.');
    return actualizado;
  };
