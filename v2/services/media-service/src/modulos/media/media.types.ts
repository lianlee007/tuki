import type { Rol } from '@tuki/dominio';

/** Identidad que llega en el JWT. */
export interface ContextoAutenticacion {
  usuarioId: string;
  rol: Rol;
  email: string;
}

/** Archivo ya validado que se va a subir. */
export interface ArchivoParaSubir {
  contentType: string;
  bytes: number;
  destino: 'platillos' | 'restaurantes' | 'resenas';
  contenido: Buffer;
}

/** Metadatos públicos de un archivo. */
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

export interface FilaMedia {
  id: string;
  usuario_id: string;
  destino: string;
  key: string;
  content_type: string;
  bytes: string;
  creado_en: Date;
}
