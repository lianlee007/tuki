import {
  cambiarActivo,
  listarTodosAdmin,
  resumenAdmin,
} from './admin-restaurantes.js';
import type { DependenciasRestaurantes } from './dependencias.js';
import {
  actualizarCategoria,
  actualizarPlatillo,
  cambiarDisponibilidad,
  crearCategoria,
  crearPlatillo,
  eliminarCategoria,
  eliminarPlatillo,
  listarCategorias,
  listarPlatillos,
} from './menu.js';
import {
  actualizarRestaurante,
  actualizarTema,
  crearRestaurante,
  miRestaurante,
  obtenerPanel,
  reemplazarCocinas,
} from './perfil-restaurante.js';
import {
  buscarPlatos,
  fichaPublica,
  listarCocinas,
  listarRestaurantes,
  menuPublico,
} from './publico.js';

/** Contrato que consume la capa HTTP. */
export interface CasosDeUsoRestaurantes {
  crear: ReturnType<typeof crearRestaurante>;
  panel: ReturnType<typeof obtenerPanel>;
  miRestaurante: ReturnType<typeof miRestaurante>;
  actualizar: ReturnType<typeof actualizarRestaurante>;
  actualizarTema: ReturnType<typeof actualizarTema>;
  reemplazarCocinas: ReturnType<typeof reemplazarCocinas>;
  fichaPublica: ReturnType<typeof fichaPublica>;
  listar: ReturnType<typeof listarRestaurantes>;
  buscarPlatos: ReturnType<typeof buscarPlatos>;
  listarCocinas: ReturnType<typeof listarCocinas>;
  menuPublico: ReturnType<typeof menuPublico>;
  listarTodosAdmin: ReturnType<typeof listarTodosAdmin>;
  resumenAdmin: ReturnType<typeof resumenAdmin>;
  cambiarActivo: ReturnType<typeof cambiarActivo>;
  listarCategorias: ReturnType<typeof listarCategorias>;
  crearCategoria: ReturnType<typeof crearCategoria>;
  actualizarCategoria: ReturnType<typeof actualizarCategoria>;
  eliminarCategoria: ReturnType<typeof eliminarCategoria>;
  listarPlatillos: ReturnType<typeof listarPlatillos>;
  crearPlatillo: ReturnType<typeof crearPlatillo>;
  actualizarPlatillo: ReturnType<typeof actualizarPlatillo>;
  eliminarPlatillo: ReturnType<typeof eliminarPlatillo>;
  cambiarDisponibilidad: ReturnType<typeof cambiarDisponibilidad>;
}

/** Raíz de composición: casos de uso + puertos inyectados. */
export const crearCasosDeUsoRestaurantes = (
  dependencias: DependenciasRestaurantes,
): CasosDeUsoRestaurantes => ({
  crear: crearRestaurante(dependencias),
  panel: obtenerPanel(dependencias),
  miRestaurante: miRestaurante(dependencias),
  actualizar: actualizarRestaurante(dependencias),
  actualizarTema: actualizarTema(dependencias),
  reemplazarCocinas: reemplazarCocinas(dependencias),
  fichaPublica: fichaPublica(dependencias),
  listar: listarRestaurantes(dependencias),
  buscarPlatos: buscarPlatos(dependencias),
  listarCocinas: listarCocinas(dependencias),
  menuPublico: menuPublico(dependencias),
  listarTodosAdmin: listarTodosAdmin(dependencias),
  resumenAdmin: resumenAdmin(dependencias),
  cambiarActivo: cambiarActivo(dependencias),
  listarCategorias: listarCategorias(dependencias),
  crearCategoria: crearCategoria(dependencias),
  actualizarCategoria: actualizarCategoria(dependencias),
  eliminarCategoria: eliminarCategoria(dependencias),
  listarPlatillos: listarPlatillos(dependencias),
  crearPlatillo: crearPlatillo(dependencias),
  actualizarPlatillo: actualizarPlatillo(dependencias),
  eliminarPlatillo: eliminarPlatillo(dependencias),
  cambiarDisponibilidad: cambiarDisponibilidad(dependencias),
});
