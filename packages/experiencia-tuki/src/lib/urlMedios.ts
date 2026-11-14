/**
 * URLs de los objetos públicos del almacén de medios.
 *
 * Los datos rescatados del Tuki original guardaron la URL absoluta del host de
 * turno (`http://169.58.151.195:8084/tuki-media/...`). Cuando el sitio se
 * publica por HTTPS, el navegador bloquea esas imágenes por contenido mixto
 * aunque el objeto siga intacto en RustFS. Aquí se reescribe solo el origen de
 * las URLs del bucket; las fotos de terceros (Cloudinary, Flickr, Wikimedia)
 * se devuelven tal cual.
 */

/** Prefijo de los objetos que sirve el API Gateway. */
const RUTA_MEDIOS = '/tuki-media/';

export interface ContextoUrlMedios {
  /** Protocolo del documento: `https:` o `http:`. */
  protocolo: string;
  /** Origen del API que publica `/tuki-media`, sin barra final. */
  origenMedios: string;
}

/** `true` si la URL apunta a un objeto del bucket público. */
export const esUrlDeMedios = (url: string): boolean => {
  try {
    return new URL(url, 'http://localhost').pathname.startsWith(RUTA_MEDIOS);
  } catch {
    return false;
  }
};

/**
 * Devuelve una URL que el navegador pueda cargar.
 *
 * Solo interviene cuando habría contenido mixto: página HTTPS e imagen HTTP
 * del bucket. En local ambas son HTTP y se respeta el almacén tal cual, que es
 * lo que usan los objetos subidos a `localhost:9000`.
 */
export const resolverUrlMedios = (
  url: string | null | undefined,
  { protocolo, origenMedios }: ContextoUrlMedios,
): string => {
  const limpia = (url ?? '').trim();
  if (!limpia) return '';

  let destino: URL;
  try {
    destino = new URL(limpia, 'http://localhost');
  } catch {
    return limpia;
  }

  if (!destino.pathname.startsWith(RUTA_MEDIOS)) return limpia;
  if (protocolo !== 'https:' || destino.protocol !== 'http:') return limpia;

  const origen = origenMedios.trim().replace(/\/+$/, '');
  if (!origen) return limpia;

  try {
    if (new URL(origen).protocol !== 'https:') return limpia;
  } catch {
    return limpia;
  }

  return `${origen}${destino.pathname}${destino.search}${destino.hash}`;
};
