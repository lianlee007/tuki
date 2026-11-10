import type { EntradaResena, Resena, ResumenResenas } from '../dominio/resena.js';

export interface EntradaResenaRepositorio extends EntradaResena {
  usuarioId: string;
}

/**
 * Puerto de persistencia de reseñas. La aplicación no conoce PostgreSQL.
 */
export interface ResenasRepositorio {
  listarPorRestaurante(restauranteId: string): Promise<Resena[]>;
  listarPorUsuario(usuarioId: string): Promise<Resena[]>;
  crear(entrada: EntradaResenaRepositorio): Promise<Resena>;
  buscarPorId(id: string): Promise<Resena | null>;
  eliminar(id: string): Promise<boolean>;
  marcarUtil(resenaId: string, usuarioId: string): Promise<void>;
  quitarUtil(resenaId: string, usuarioId: string): Promise<void>;
  responder(id: string, respuesta: string): Promise<Resena | null>;
  borrarRespuesta(id: string): Promise<Resena | null>;
  cambiarVisible(id: string, visible: boolean): Promise<Resena | null>;
  resumen(restauranteId: string): Promise<ResumenResenas>;
}
