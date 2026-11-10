/** Códigos de error del dominio, sin dependencia de HTTP. */
export type CodigoError =
  | 'no_encontrado'
  | 'no_autorizado'
  | 'prohibido'
  | 'validacion'
  | 'servicio_no_disponible';

/** Error de negocio. La capa de entrada decide qué código HTTP le corresponde. */
export class ErrorDominio extends Error {
  constructor(
    public readonly codigo: CodigoError,
    mensaje: string,
    public readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = 'ErrorDominio';
  }
}

export const errorNoEncontrado = (mensaje: string) =>
  new ErrorDominio('no_encontrado', mensaje);

export const errorNoAutorizado = (mensaje: string) =>
  new ErrorDominio('no_autorizado', mensaje);

export const errorProhibido = (mensaje: string) =>
  new ErrorDominio('prohibido', mensaje);

export const errorValidacion = (mensaje: string) =>
  new ErrorDominio('validacion', mensaje);

export const errorServicioNoDisponible = (mensaje: string) =>
  new ErrorDominio('servicio_no_disponible', mensaje);
