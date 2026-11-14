/**
 * Normaliza las URLs de los objetos del bucket público.
 *
 * Los datos rescatados del Tuki original guardaron la URL absoluta del host de
 * turno (`http://IP:8084/tuki-media/...`). Sobre el sitio HTTPS el navegador
 * bloquea esas peticiones por contenido mixto, así que el servicio reescribe
 * el origen a la URL pública configurada. Las fotos de terceros (Flickr,
 * Wikimedia, Cloudinary) se devuelven tal cual.
 */

/** Ruta bajo la que el API Gateway publica los objetos del bucket. */
const RUTA_MEDIOS = '/tuki-media/';

/** `true` si la URL apunta a un objeto del bucket público. */
export const esUrlDeMedios = (url: string): boolean => {
  try {
    return new URL(url, 'https://tuki.local').pathname.startsWith(RUTA_MEDIOS);
  } catch {
    return false;
  }
};

/**
 * Devuelve la URL pública de la imagen, sin perder nulos ni rutas ajenas.
 *
 * Solo reescribe cuando la base pública es HTTPS: en local el almacén se sirve
 * por HTTP y debe respetarse tal cual. Si la URL ya apunta a la base pública,
 * se devuelve sin cambios.
 */
export const normalizarUrlMedios = (
  url: string | null | undefined,
  basePublica?: string,
): string | null => {
  const valor = (url ?? '').trim();
  if (!valor) return url == null ? null : '';

  const base = (basePublica ?? '').trim().replace(/\/+$/, '');
  if (!base) return valor;

  let origenPublico: URL;
  try {
    origenPublico = new URL(base);
  } catch {
    return valor;
  }

  // Sin HTTPS no hay contenido mixto que corregir y se conserva el origen
  // original, que es lo que usan los entornos locales con RustFS.
  if (origenPublico.protocol !== 'https:') return valor;

  let destino: URL;
  try {
    destino = new URL(valor, base);
  } catch {
    return valor;
  }

  if (!destino.pathname.startsWith(RUTA_MEDIOS)) return valor;

  // La base puede incluir ya la ruta del bucket (`.../tuki-media`). En ese caso
  // se quita del destino para no duplicarla.
  const prefijo = origenPublico.pathname.replace(/\/+$/, '');
  const ruta =
    prefijo && destino.pathname.startsWith(`${prefijo}/`)
      ? destino.pathname.slice(prefijo.length)
      : destino.pathname;

  return `${origenPublico.origin}${prefijo}${ruta}${destino.search}${destino.hash}`;
};
