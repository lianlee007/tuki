import { errorConflicto, errorNoEncontrado } from '../dominio/errores.js';
import { exigirDueno, exigirPropietario } from '../dominio/propiedad.js';
import type {
  EntradaActualizarRestaurante,
  EntradaCrearRestaurante,
  EntradaTema,
  PanelRestaurante,
} from '../dominio/restaurante.js';
import { generarSlug } from '../dominio/slug.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import type { DependenciasRestaurantes } from './dependencias.js';
import type { RestaurantesRepositorio } from '../puertos/restaurantes.repositorio.js';

const slugUnico = async (
  repositorio: RestaurantesRepositorio,
  base: string,
): Promise<string> => {
  let slug = base;
  let intento = 2;
  while (await repositorio.existeSlug(slug)) {
    slug = `${base}-${intento}`;
    intento += 1;
  }
  return slug;
};

/** Caso de uso: alta del restaurante del dueño autenticado. */
export const crearRestaurante =
  ({ restaurantes }: DependenciasRestaurantes) =>
  async (usuario: ContextoAutenticacion, entrada: EntradaCrearRestaurante) => {
    exigirDueno(usuario);

    const existente = await restaurantes.buscarPorDueno(usuario.usuarioId);
    if (existente) {
      throw errorConflicto('Tu cuenta ya tiene un restaurante.');
    }

    const slug = await slugUnico(
      restaurantes,
      generarSlug(entrada.slug ?? entrada.nombre),
    );
    return restaurantes.crearConBase({
      ...entrada,
      slug,
      duenoId: usuario.usuarioId,
    });
  };

/** Caso de uso: panel del dueño con menú, tema y cocinas. */
export const obtenerPanel =
  ({ restaurantes, menu }: DependenciasRestaurantes) =>
  async (
    usuario: ContextoAutenticacion,
    restauranteId: string,
  ): Promise<PanelRestaurante> => {
    const fila = await restaurantes.buscarPorId(restauranteId);
    if (!fila) throw errorNoEncontrado('No encontramos el restaurante.');
    exigirPropietario(usuario, fila.duenoId);

    const tema = await restaurantes.temaDe(restauranteId);
    if (!tema) {
      throw errorNoEncontrado('El restaurante no tiene tema configurado.');
    }

    const { duenoId, ...restaurante } = fila;
    return {
      restaurante,
      tema,
      cocinas: await restaurantes.cocinasDe(restauranteId),
      categorias: await menu.listarCategorias(restauranteId),
      platillos: await menu.listarPlatillos(restauranteId),
      duenoId,
    };
  };

/** Caso de uso: restaurante del dueño sin conocer el id. */
export const miRestaurante =
  (dependencias: DependenciasRestaurantes) =>
  async (usuario: ContextoAutenticacion): Promise<PanelRestaurante> => {
    exigirDueno(usuario);
    const fila = await dependencias.restaurantes.buscarPorDueno(usuario.usuarioId);
    if (!fila) throw errorNoEncontrado('Todavía no tienes un restaurante.');
    return obtenerPanel(dependencias)(usuario, fila.id);
  };

export const actualizarRestaurante =
  ({ restaurantes }: DependenciasRestaurantes) =>
  async (
    usuario: ContextoAutenticacion,
    restauranteId: string,
    entrada: EntradaActualizarRestaurante,
  ) => {
    const fila = await restaurantes.buscarPorId(restauranteId);
    if (!fila) throw errorNoEncontrado('No encontramos el restaurante.');
    exigirPropietario(usuario, fila.duenoId);

    const actualizada = await restaurantes.actualizar(restauranteId, entrada);
    if (!actualizada) throw errorNoEncontrado('No encontramos el restaurante.');
    const { duenoId: _duenoId, ...restaurante } = actualizada;
    return restaurante;
  };

export const actualizarTema =
  ({ restaurantes }: DependenciasRestaurantes) =>
  async (
    usuario: ContextoAutenticacion,
    restauranteId: string,
    entrada: EntradaTema,
  ) => {
    const fila = await restaurantes.buscarPorId(restauranteId);
    if (!fila) throw errorNoEncontrado('No encontramos el restaurante.');
    exigirPropietario(usuario, fila.duenoId);

    const tema = await restaurantes.actualizarTema(restauranteId, entrada);
    if (!tema) {
      throw errorNoEncontrado('El restaurante no tiene tema configurado.');
    }
    return tema;
  };

export const reemplazarCocinas =
  ({ restaurantes }: DependenciasRestaurantes) =>
  async (
    usuario: ContextoAutenticacion,
    restauranteId: string,
    cocinas: string[],
  ) => {
    const fila = await restaurantes.buscarPorId(restauranteId);
    if (!fila) throw errorNoEncontrado('No encontramos el restaurante.');
    exigirPropietario(usuario, fila.duenoId);

    await restaurantes.reemplazarCocinas(restauranteId, cocinas);
    return restaurantes.cocinasDe(restauranteId);
  };
