import { errorNoEncontrado } from '../../lib/errores.js';
import { exigirPropietario } from './propiedad.js';
import * as repo from './menu.repository.js';
import * as restaurantes from './restaurantes.repository.js';
import type { EntradaCategoria, EntradaPlatillo } from './restaurantes.schema.js';
import type { ContextoAutenticacion } from './restaurantes.types.js';

const verificarDuenoDelLocal = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
) => {
  const fila = await restaurantes.buscarPorId(restauranteId);
  if (!fila) throw errorNoEncontrado('No encontramos el restaurante.');
  exigirPropietario(usuario, fila.dueno_id);
};

export const listarCategorias = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
) => {
  await verificarDuenoDelLocal(usuario, restauranteId);
  return repo.listarCategorias(restauranteId);
};

export const crearCategoria = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
  entrada: EntradaCategoria,
) => {
  await verificarDuenoDelLocal(usuario, restauranteId);
  const creada = await repo.crearCategoria(restauranteId, entrada);
  if (!creada) throw new Error('No se pudo crear la categoría.');
  return creada;
};

export const actualizarCategoria = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
  categoriaId: string,
  entrada: Partial<EntradaCategoria>,
) => {
  await verificarDuenoDelLocal(usuario, restauranteId);
  const actualizada = await repo.actualizarCategoria(restauranteId, categoriaId, entrada);
  if (!actualizada) throw errorNoEncontrado('No encontramos la categoría.');
  return actualizada;
};

export const eliminarCategoria = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
  categoriaId: string,
) => {
  await verificarDuenoDelLocal(usuario, restauranteId);
  const eliminada = await repo.eliminarCategoria(restauranteId, categoriaId);
  if (!eliminada) throw errorNoEncontrado('No encontramos la categoría.');
};

export const listarPlatillos = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
) => {
  await verificarDuenoDelLocal(usuario, restauranteId);
  return repo.listarPlatillos(restauranteId);
};

export const crearPlatillo = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
  entrada: EntradaPlatillo,
) => {
  await verificarDuenoDelLocal(usuario, restauranteId);
  const creado = await repo.crearPlatillo(restauranteId, entrada);
  if (!creado) throw new Error('No se pudo crear el platillo.');
  return creado;
};

export const actualizarPlatillo = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
  platilloId: string,
  entrada: Partial<EntradaPlatillo>,
) => {
  await verificarDuenoDelLocal(usuario, restauranteId);
  const actualizado = await repo.actualizarPlatillo(restauranteId, platilloId, entrada);
  if (!actualizado) throw errorNoEncontrado('No encontramos el platillo.');
  return actualizado;
};

export const eliminarPlatillo = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
  platilloId: string,
) => {
  await verificarDuenoDelLocal(usuario, restauranteId);
  const eliminado = await repo.eliminarPlatillo(restauranteId, platilloId);
  if (!eliminado) throw errorNoEncontrado('No encontramos el platillo.');
};

export const cambiarDisponibilidad = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
  platilloId: string,
  disponible: boolean,
) => {
  await verificarDuenoDelLocal(usuario, restauranteId);
  const actualizado = await repo.cambiarDisponibilidad(
    restauranteId,
    platilloId,
    disponible,
  );
  if (!actualizado) throw errorNoEncontrado('No encontramos el platillo.');
  return actualizado;
};
