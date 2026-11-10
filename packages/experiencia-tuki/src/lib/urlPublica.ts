/**
 * Origen público de la aplicación.
 *
 * Los enlaces que se comparten por WhatsApp o se imprimen en un QR no deben
 * depender de cómo abrió el panel el dueño. En el VPS el sitio se publica en
 * `http://HOST:8080` y también en el puerto 80; los navegadores móviles
 * intentan HTTPS en el 80 y, sin certificado, el proxy responde 404. Un enlace
 * con el puerto explícito (`:8080`) no se actualiza a HTTPS y carga.
 *
 * `VITE_PUBLIC_APP_URL` fija ese origen canónico. Sin la variable se usa el
 * origen actual del navegador, que es el comportamiento histórico.
 */
import { ENV } from '../constantes';

/** Une un origen y una ruta sin duplicar ni perder la barra inicial. */
export function unirOrigen(origen: string, ruta = ''): string {
  const base = origen.replace(/\/+$/, '');
  if (!ruta) return base;
  return `${base}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
}

/**
 * Resuelve el origen: manda el configurado y, si está vacío, el actual.
 * Se expone para poder probarlo sin depender del DOM.
 */
export function resolverOrigen(
  configurado: string,
  actual = typeof window !== 'undefined' ? window.location.origin : '',
): string {
  const base = configurado.trim();
  return unirOrigen(base || actual);
}

/** Origen canónico, sin barra final. */
export function origenPublico(): string {
  return resolverOrigen(ENV.PUBLIC_APP_URL);
}

/** URL absoluta para una ruta de la SPA. */
export function urlPublica(ruta = ''): string {
  return unirOrigen(origenPublico(), ruta);
}
