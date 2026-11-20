import { crearApiIa } from './ai.api.js';
import { crearApiIdentidad } from './identidad.api.js';
import { crearApiAdmin } from './admin.api.js';
import { crearApiMedia } from './media.api.js';
import { crearApiPedidos } from './pedidos.api.js';
import { crearApiResenas } from './resenas.api.js';
import { crearApiRestaurantes } from './restaurantes.api.js';
import { crearHttp } from './http.js';

export interface UrlsServicios {
  identidad: string;
  restaurantes: string;
  media: string;
  pedidos: string;
  resenas: string;
  admin: string;
  ai: string;
}

export interface OpcionesApis {
  urls: UrlsServicios;
  obtenerToken?: () => string | null | undefined;
}

/** Construye un cliente por servicio con el mismo manejo de token y error. */
export const crearApis = (opciones: OpcionesApis) => {
  const http = (baseUrl: string) =>
    crearHttp({ baseUrl, obtenerToken: opciones.obtenerToken });

  return {
    identidad: crearApiIdentidad(http(opciones.urls.identidad)),
    restaurantes: crearApiRestaurantes(http(opciones.urls.restaurantes)),
    media: crearApiMedia(http(opciones.urls.media)),
    pedidos: crearApiPedidos(http(opciones.urls.pedidos)),
    resenas: crearApiResenas(http(opciones.urls.resenas)),
    admin: crearApiAdmin(http(opciones.urls.admin)),
    ia: crearApiIa(http(opciones.urls.ai)),
  };
};

export type Apis = ReturnType<typeof crearApis>;
