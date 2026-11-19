import { config } from '../../config.js';
import type { ClasificadorImagenes } from '../../puertos/clasificador.imagenes.js';

/** Forma de la respuesta del servicio de visión. */
interface RespuestaVision {
  es_comida?: boolean;
  probabilidad_comida?: number;
}

/**
 * Adaptador HTTP del servicio de visión (Ultralytics + YOLO11n-cls).
 *
 * Si el servicio no responde o tarda más de la cuenta devuelve `null`: una
 * caída de visión no debe impedir que un dueño publique su menú.
 */
export const crearClasificadorVision = (
  url: string = config.VISION_URL,
  timeoutMs: number = config.VISION_TIMEOUT_MS,
): ClasificadorImagenes => ({
  async esComida(contenido, contentType) {
    const datos = new FormData();
    datos.append('imagen', new Blob([contenido], { type: contentType }), 'foto');

    try {
      const respuesta = await fetch(`${url}/api/v1/vision/clasificar`, {
        method: 'POST',
        body: datos,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!respuesta.ok) return null;

      const cuerpo = (await respuesta.json()) as RespuestaVision;
      return typeof cuerpo.es_comida === 'boolean' ? cuerpo.es_comida : null;
    } catch {
      return null;
    }
  },
});
