/**
 * Error de aplicación con estado HTTP y código estable.
 *
 * El código es el que consume el frontend; el mensaje es el que ve la persona.
 * Nunca se expone el detalle interno de una excepción de base de datos.
 */
export class ErrorHttp extends Error {
  constructor(
    public readonly estado: number,
    public readonly codigo: string,
    mensaje: string,
    public readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = 'ErrorHttp';
  }
}

export const errorNoEncontrado = (mensaje: string) =>
  new ErrorHttp(404, 'no_encontrado', mensaje);

export const errorConflicto = (mensaje: string) =>
  new ErrorHttp(409, 'conflicto', mensaje);

export const errorNoAutorizado = (mensaje: string) =>
  new ErrorHttp(401, 'no_autorizado', mensaje);

export const errorProhibido = (mensaje: string) =>
  new ErrorHttp(403, 'prohibido', mensaje);
