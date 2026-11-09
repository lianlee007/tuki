import { crearRepositorioMenu } from './adaptadores/postgres/menu.repositorio.js';
import { crearRepositorioPublico } from './adaptadores/postgres/publico.repositorio.js';
import { crearRepositorioRestaurantes } from './adaptadores/postgres/restaurantes.repositorio.js';
import { crearCasosDeUsoRestaurantes } from './aplicacion/casos-uso.js';

/** Raíz de composición: une adaptadores PostgreSQL con casos de uso. */
export const crearServiciosRestaurantes = () =>
  crearCasosDeUsoRestaurantes({
    restaurantes: crearRepositorioRestaurantes(),
    menu: crearRepositorioMenu(),
    publico: crearRepositorioPublico(),
  });
