import type {
  Categoria,
  EntradaActualizarCategoria,
  EntradaActualizarPlatillo,
  EntradaCategoria,
  EntradaPlatillo,
  Platillo,
} from '../../dominio/restaurante.js';
import type { MenuRepositorio } from '../../puertos/menu.repositorio.js';
import { sql } from './cliente.js';
import { aCategoria, aPlatillo } from './mapper.js';
import type { FilaCategoria, FilaPlatillo } from './tipos.js';

const sinVacios = (datos: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(datos).filter(([, valor]) => valor !== undefined));

const listarCategorias = async (restauranteId: string): Promise<Categoria[]> => {
  const filas = await sql<FilaCategoria[]>`
    select * from categorias
    where restaurante_id = ${restauranteId} and activo
    order by orden, nombre
  `;
  return filas.map(aCategoria);
};

const crearCategoria = async (
  restauranteId: string,
  entrada: EntradaCategoria,
): Promise<Categoria | null> => {
  const [fila] = await sql<FilaCategoria[]>`
    insert into categorias (restaurante_id, nombre, descripcion, icono, orden)
    values (${restauranteId}, ${entrada.nombre}, ${entrada.descripcion ?? null},
            ${entrada.icono ?? null}, ${entrada.orden})
    returning *
  `;
  return fila ? aCategoria(fila) : null;
};

const actualizarCategoria = async (
  restauranteId: string,
  categoriaId: string,
  entrada: EntradaActualizarCategoria,
): Promise<Categoria | null> => {
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

const eliminarCategoria = async (
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

const listarPlatillos = async (restauranteId: string): Promise<Platillo[]> => {
  const filas = await sql<FilaPlatillo[]>`
    select * from platillos
    where restaurante_id = ${restauranteId} and activo
    order by orden, nombre
  `;
  return filas.map(aPlatillo);
};

const crearPlatillo = async (
  restauranteId: string,
  entrada: EntradaPlatillo,
): Promise<Platillo | null> => {
  const [fila] = await sql<FilaPlatillo[]>`
    insert into platillos (
      restaurante_id, categoria_id, nombre, descripcion, precio, imagen_url,
      disponible, vegetariano, vegano, picante, activo, ingredientes, alergenos,
      destacado, tiempo_preparacion, orden
    ) values (
      ${restauranteId}, ${entrada.categoriaId ?? null}, ${entrada.nombre},
      ${entrada.descripcion ?? null}, ${entrada.precio}, ${entrada.imagenUrl ?? null},
      ${entrada.disponible}, ${entrada.vegetariano}, ${entrada.vegano},
      ${entrada.picante}, ${entrada.activo ?? true}, ${entrada.ingredientes ?? []},
      ${entrada.alergenos ?? []}, ${entrada.destacado ?? false},
      ${entrada.tiempoPreparacion ?? null}, ${entrada.orden}
    )
    returning *
  `;
  return fila ? aPlatillo(fila) : null;
};

const actualizarPlatillo = async (
  restauranteId: string,
  platilloId: string,
  entrada: EntradaActualizarPlatillo,
): Promise<Platillo | null> => {
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
    ingredientes: entrada.ingredientes,
    alergenos: entrada.alergenos,
    destacado: entrada.destacado,
    tiempo_preparacion: entrada.tiempoPreparacion,
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

const eliminarPlatillo = async (
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

const cambiarDisponibilidad = async (
  restauranteId: string,
  platilloId: string,
  disponible: boolean,
): Promise<Platillo | null> => {
  const [fila] = await sql<FilaPlatillo[]>`
    update platillos set disponible = ${disponible}, actualizado_en = now()
    where id = ${platilloId} and restaurante_id = ${restauranteId} and activo
    returning *
  `;
  return fila ? aPlatillo(fila) : null;
};

/** Adaptador PostgreSQL del puerto `MenuRepositorio`. */
export const crearRepositorioMenu = (): MenuRepositorio => ({
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  listarPlatillos,
  crearPlatillo,
  actualizarPlatillo,
  eliminarPlatillo,
  cambiarDisponibilidad,
});
