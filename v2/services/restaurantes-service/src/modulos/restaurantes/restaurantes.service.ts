import { errorConflicto, errorNoEncontrado } from '../../lib/errores.js';
import { generarSlug } from '../../lib/slug.js';
import * as menu from './menu.repository.js';
import * as publico from './publico.repository.js';
import { aRestaurante, aTema } from './restaurantes.mapper.js';
import { exigirDueno, exigirPropietario } from './propiedad.js';
import * as repo from './restaurantes.repository.js';
import type {
  EntradaActualizarRestaurante,
  EntradaCrearRestaurante,
  EntradaTema,
} from './restaurantes.schema.js';
import type {
  ContextoAutenticacion,
  PanelRestaurante,
  RestaurantePublico,
} from './restaurantes.types.js';

const slugUnico = async (base: string): Promise<string> => {
  let slug = base;
  let intento = 2;
  while (await repo.existeSlug(slug)) {
    slug = `${base}-${intento}`;
    intento += 1;
  }
  return slug;
};

/** Alta del restaurante del dueño autenticado. */
export const crear = async (
  usuario: ContextoAutenticacion,
  entrada: EntradaCrearRestaurante,
) => {
  exigirDueno(usuario);

  const existente = await repo.buscarPorDueno(usuario.usuarioId);
  if (existente) {
    throw errorConflicto('Tu cuenta ya tiene un restaurante.');
  }

  const slug = await slugUnico(generarSlug(entrada.slug ?? entrada.nombre));
  return repo.crearConBase({
    ...entrada,
    slug,
    duenoId: usuario.usuarioId,
  });
};

/** Panel del dueño: restaurante, tema, cocinas, categorías y platillos. */
export const obtenerPanel = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
): Promise<PanelRestaurante> => {
  const fila = await repo.buscarPorId(restauranteId);
  if (!fila) throw errorNoEncontrado('No encontramos el restaurante.');
  exigirPropietario(usuario, fila.dueno_id);

  const tema = await repo.temaDe(restauranteId);
  if (!tema) throw errorNoEncontrado('El restaurante no tiene tema configurado.');

  return {
    restaurante: aRestaurante(fila),
    tema,
    cocinas: await repo.cocinasDe(restauranteId),
    categorias: await menu.listarCategorias(restauranteId),
    platillos: await menu.listarPlatillos(restauranteId),
    duenoId: fila.dueno_id,
  };
};

/** Restaurante del dueño autenticado, sin necesidad de conocer el id. */
export const miRestaurante = async (
  usuario: ContextoAutenticacion,
): Promise<PanelRestaurante> => {
  exigirDueno(usuario);
  const fila = await repo.buscarPorDueno(usuario.usuarioId);
  if (!fila) throw errorNoEncontrado('Todavía no tienes un restaurante.');
  return obtenerPanel(usuario, fila.id);
};

export const actualizar = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
  entrada: EntradaActualizarRestaurante,
) => {
  const fila = await repo.buscarPorId(restauranteId);
  if (!fila) throw errorNoEncontrado('No encontramos el restaurante.');
  exigirPropietario(usuario, fila.dueno_id);

  const actualizada = await repo.actualizar(restauranteId, entrada);
  if (!actualizada) throw errorNoEncontrado('No encontramos el restaurante.');
  return aRestaurante(actualizada);
};

export const actualizarTema = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
  entrada: EntradaTema,
) => {
  const fila = await repo.buscarPorId(restauranteId);
  if (!fila) throw errorNoEncontrado('No encontramos el restaurante.');
  exigirPropietario(usuario, fila.dueno_id);

  const tema = await repo.actualizarTema(restauranteId, entrada);
  if (!tema) throw errorNoEncontrado('El restaurante no tiene tema configurado.');
  return aTema(tema);
};

export const reemplazarCocinas = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
  cocinas: string[],
) => {
  const fila = await repo.buscarPorId(restauranteId);
  if (!fila) throw errorNoEncontrado('No encontramos el restaurante.');
  exigirPropietario(usuario, fila.dueno_id);

  await repo.reemplazarCocinas(restauranteId, cocinas);
  return repo.cocinasDe(restauranteId);
};

export const fichaPublica = async (slug: string): Promise<RestaurantePublico> => {
  const ficha = await publico.obtenerPublico(slug);
  if (!ficha) throw errorNoEncontrado('No encontramos ese restaurante.');
  return ficha;
};

export const listar = publico.listarRestaurantes;
export const buscarPlatos = publico.buscarPlatos;
export const listarCocinas = repo.listarCocinas;

export const menuPublico = async (restauranteId: string) => {
  const menu = await publico.obtenerMenuPublico(restauranteId);
  if (!menu) throw errorNoEncontrado('No encontramos ese restaurante.');
  return menu;
};
