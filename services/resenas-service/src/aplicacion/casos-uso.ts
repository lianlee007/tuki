import { cambiarVisibilidadResena } from './cambiar-visibilidad.js';
import { crearResena } from './crear-resena.js';
import { eliminarResena } from './eliminar-resena.js';
import { listarMisResenas, listarResenas } from './listar-resenas.js';
import {
  borrarRespuestaResena,
  responderResena,
} from './responder-resena.js';
import {
  marcarResenaUtil,
  quitarResenaUtil,
} from './utilidades-resena.js';
import type { ResenasRepositorio } from '../puertos/resenas.repositorio.js';
import type { RestaurantesCliente } from '../puertos/restaurantes.cliente.js';

interface Dependencias {
  resenas: ResenasRepositorio;
  restaurantes: RestaurantesCliente;
}

/** Contrato que consume la capa HTTP. */
export interface CasosDeUsoResenas {
  listar: ReturnType<typeof listarResenas>;
  crear: ReturnType<typeof crearResena>;
  mias: ReturnType<typeof listarMisResenas>;
  eliminar: ReturnType<typeof eliminarResena>;
  marcarUtil: ReturnType<typeof marcarResenaUtil>;
  quitarUtil: ReturnType<typeof quitarResenaUtil>;
  responder: ReturnType<typeof responderResena>;
  borrarRespuesta: ReturnType<typeof borrarRespuestaResena>;
  cambiarVisible: ReturnType<typeof cambiarVisibilidadResena>;
}

/** Raíz de composición: casos de uso + adaptadores concretos. */
export const crearCasosDeUsoResenas = (
  dependencias: Dependencias,
): CasosDeUsoResenas => ({
  listar: listarResenas(dependencias),
  crear: crearResena(dependencias),
  mias: listarMisResenas(dependencias),
  eliminar: eliminarResena(dependencias),
  marcarUtil: marcarResenaUtil(dependencias),
  quitarUtil: quitarResenaUtil(dependencias),
  responder: responderResena(dependencias),
  borrarRespuesta: borrarRespuestaResena(dependencias),
  cambiarVisible: cambiarVisibilidadResena(dependencias),
});
