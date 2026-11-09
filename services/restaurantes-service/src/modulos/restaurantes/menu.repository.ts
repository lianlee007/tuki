import { sql } from '../../db/cliente.js';
import type { EntradaCategoria, EntradaPlatillo } from './restaurantes.schema.js';
import { aCategoria, aPlatillo } from './restaurantes.mapper.js';
import type { FilaCategoria, FilaPlatillo } from './restaurantes.types.js';

const sinVacios = (datos: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(datos).filter(([, valor]) => valor !== undefined));

export const listarCategorias = async (restauranteId: string) => {
  const filas = await sql<FilaCategoria[]>`
    select * from categorias
    where restaurante_id = ${restauranteId} and activo
    order by orden, nombre
  `;
  return filas.map(aCategoria);
};

export const crearCategoria = async (
  restauranteId: string,
  entrada: EntradaCategoria,
) => {
  const [fila] = await sql<FilaCategoria[]>`
    insert into categorias (restaurante_id, nombre, descripcion, icono, orden)
    values (${restauranteId}, ${entrada.nombre}, ${entrada.descripcion ?? null},
            ${entrada.icono ?? null}, ${entrada.orden})
    returning *
  `;
  return fila ? aCategoria(fila) : null;
};

export const actualizarCategoria = async (
  restauranteId: string,
  categoriaId: string,
  entrada: Partial<EntradaCategoria>,
) => {
  const cambios = sinVacios({
    nombre: entrada.nombre,
    descripcion: entrada.descripcion,
    icono: entrada.icono,
    orden: entrada.orden,
  });
  if (Object.keys(cambios).length === 0) return null;

  const [fila] = await sql<FilaCategoria[]>`
    update categorias set ${sql(cambios)}, actualizado_en = now()
    where id = ${categoriaId} and restaurante_id = ${restauranteId}
    returning *
  `;
  return fila ? aCategoria(fila) : null;
};

export const eliminarCategoria = async (
  restauranteId: string,
  categoriaId: string,
): Promise<boolean> => {
  const filas = await sql`
    update categorias set activo = false, actualizado_en = now()
    where id = ${categoriaId} and restaurante_id = ${restauranteId}
    returning id
  `;
  return filas.length > 0;
};

export const listarPlatillos = async (restauranteId: string) => {
  const filas = await sql<FilaPlatillo[]>`
    select * from platillos
    where restaurante_id = ${restauranteId} and activo
    order by orden, nombre
  `;
  return filas.map(aPlatillo);
};

export const crearPlatillo = async (
  restauranteId: string,
  entrada: EntradaPlatillo,
) => {
  const [fila] = await sql<FilaPlatillo[]>`
    insert into platillos (
      restaurante_id, categoria_id, nombre, descripcion, precio, imagen_url,
      disponible, vegetariano, vegano, picante, activo, orden
    ) values (
      ${restauranteId}, ${entrada.categoriaId ?? null}, ${entrada.nombre},
      ${entrada.descripcion ?? null}, ${entrada.precio}, ${entrada.imagenUrl ?? null},
      ${entrada.disponible}, ${entrada.vegetariano}, ${entrada.vegano},
      ${entrada.picante}, ${entrada.activo ?? true}, ${entrada.orden}
    )
    returning *
  `;
  return fila ? aPlatillo(fila) : null;
};

export const actualizarPlatillo = async (
  restauranteId: string,
  platilloId: string,
  entrada: Partial<EntradaPlatillo>,
) => {
  const cambios = sinVacios({
    categoria_id: entrada.categoriaId,
    nombre: entrada.nombre,
    descripcion: entrada.descripcion,
    precio: entrada.precio,
    imagen_url: entrada.imagenUrl,
    disponible: entrada.disponible,
    vegetariano: entrada.vegetariano,
    vegano: entrada.vegano,
    picante: entrada.picante,
    activo: entrada.activo,
    orden: entrada.orden,
  });
  if (Object.keys(cambios).length === 0) return null;

  const [fila] = await sql<FilaPlatillo[]>`
    update platillos set ${sql(cambios)}, actualizado_en = now()
    where id = ${platilloId} and restaurante_id = ${restauranteId}
    returning *
  `;
  return fila ? aPlatillo(fila) : null;
};

export const eliminarPlatillo = async (
  restauranteId: string,
  platilloId: string,
): Promise<boolean> => {
  const filas = await sql`
    update platillos set activo = false, actualizado_en = now()
    where id = ${platilloId} and restaurante_id = ${restauranteId}
    returning id
  `;
  return filas.length > 0;
};

export const cambiarDisponibilidad = async (
  restauranteId: string,
  platilloId: string,
  disponible: boolean,
) => {
  const [fila] = await sql<FilaPlatillo[]>`
    update platillos set disponible = ${disponible}, actualizado_en = now()
    where id = ${platilloId} and restaurante_id = ${restauranteId} and activo
    returning *
  `;
  return fila ? aPlatillo(fila) : null;
};
