/** Error de aplicación con estado HTTP y código estable. */
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
export const errorNoAutorizado = (mensaje: string) =>
  new ErrorHttp(401, 'no_autorizado', mensaje);
export const errorProhibido = (mensaje: string) =>
  new ErrorHttp(403, 'prohibido', mensaje);
export const errorValidacion = (mensaje: string) =>
  new ErrorHttp(400, 'validacion', mensaje);
