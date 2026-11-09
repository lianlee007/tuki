import { errorValidacion } from './errores.js';
import type { ContextoAutenticacion } from './usuario.js';

export const DESTINOS = ['platillos', 'restaurantes', 'resenas'] as const;
export type Destino = (typeof DESTINOS)[number];

/** Archivo que llega desde multipart y todavía no se ha guardado. */
export interface ArchivoParaSubir {
  contentType: string;
  bytes: number;
  destino: Destino;
  contenido: Buffer;
}

/** Metadatos persistidos, sin URL: la URL depende del almacén. */
export interface MediaRegistro {
  id: string;
  usuarioId: string;
  destino: Destino;
  key: string;
  contentType: string;
  bytes: number;
  creadoEn: string;
}

/** Metadatos públicos que consume la interfaz. */
export interface MediaAsset extends MediaRegistro {
  url: string;
}

const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const LIMITE_MENU = 5 * 1024 * 1024;
const LIMITE_RESENA = 8 * 1024 * 1024;

export interface ArchivoEntrante {
  contentType: string;
  bytes: number;
  destino: Destino;
}

/**
 * Valida tipo y tamaño antes de tocar la red.
 *
 * La compresión ocurre en el navegador; el servidor repite la comprobación
 * porque nunca se confía en el cliente.
 */
export const validarArchivo = (archivo: ArchivoEntrante): string | null => {
  if (!TIPOS.includes(archivo.contentType)) {
    return 'Elige una imagen JPG, PNG, WebP o AVIF.';
  }

  const limite = archivo.destino === 'resenas' ? LIMITE_RESENA : LIMITE_MENU;
  if (archivo.bytes <= 0) return 'El archivo llegó vacío.';
  if (archivo.bytes > limite) {
    return `La imagen supera el máximo de ${Math.round(limite / 1024 / 1024)} MB.`;
  }

  return null;
};

/** Extensión estable a partir del tipo real, no del nombre del archivo. */
export const extensionDe = (contentType: string): string => {
  const mapa: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
  };
  const extension = mapa[contentType];
  if (!extension) throw errorValidacion('El tipo de imagen no está permitido.');
  return extension;
};

/**
 * Las fotos de menú y de local son del dueño; las de reseña las puede subir
 * cualquier persona autenticada.
 */
export const puedeSubir = (
  usuario: ContextoAutenticacion,
  destino: Destino,
): boolean => destino === 'resenas' || usuario.rol !== 'cliente';
