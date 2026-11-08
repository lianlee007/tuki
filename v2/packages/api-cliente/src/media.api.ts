import type { ClienteHttp } from './http.js';

export type DestinoMedia = 'platillos' | 'restaurantes' | 'resenas';

export interface MediaAsset {
  id: string;
  usuarioId: string;
  destino: string;
  key: string;
  url: string;
  contentType: string;
  bytes: number;
  creadoEn: string;
}

/** Contrato del servicio de medios. */
export const crearApiMedia = (http: ClienteHttp) => ({
  subir: (archivo: File, destino: DestinoMedia) => {
    const datos = new FormData();
    datos.append('archivo', archivo);
    return http.solicitar<MediaAsset>(
      `/v1/media/subir?destino=${encodeURIComponent(destino)}`,
      { method: 'POST', body: datos },
    );
  },

  mios: () => http.solicitar<{ items: MediaAsset[] }>('/v1/media/mios'),
});
