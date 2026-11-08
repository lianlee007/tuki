import type { ErrorApi, RespuestaError } from '@tuki/dominio';

/** Error uniforme del cliente HTTP. */
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

export interface OpcionesHttp {
  baseUrl: string;
  /** Se consulta en cada petición para no guardar el token en el cliente. */
  obtenerToken?: () => string | null | undefined;
}

export interface ClienteHttp {
  solicitar: <T>(ruta: string, init?: RequestInit) => Promise<T>;
}

/**
 * Cliente mínimo sobre `fetch`.
 *
 * Centraliza la URL base, el token y el formato de error. Ningún componente
 * debe armar URLs ni cabeceras por su cuenta.
 */
export const crearHttp = (opciones: OpcionesHttp): ClienteHttp => {
  const baseUrl = opciones.baseUrl.replace(/\/+$/, '');

  const solicitar = async <T>(ruta: string, init: RequestInit = {}): Promise<T> => {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const token = opciones.obtenerToken?.();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const respuesta = await fetch(`${baseUrl}${ruta}`, { ...init, headers });
    if (respuesta.status === 204) return undefined as T;

    const datos = (await respuesta.json().catch(() => null)) as
      | T
      | RespuestaError
      | null;

    if (!respuesta.ok) {
      const error = (datos as RespuestaError | null)?.error ?? {
        codigo: 'error_http',
        mensaje: `La petición falló con estado ${respuesta.status}.`,
      };
      throw new ErrorHttp(respuesta.status, error.codigo, error.mensaje, error.detalles);
    }

    return datos as T;
  };

  return { solicitar };
};

/** Convierte cualquier error del cliente en un mensaje para la interfaz. */
export const mensajeDeError = (error: unknown): string => {
  if (error instanceof ErrorHttp) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
};

export type { ErrorApi };
