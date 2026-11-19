/**
 * Descripción: revisión local de fotos de platos.
 *
 * El dueño sube una foto y el servicio de visión (Ultralytics, en la red
 * interna) decide si parece comida antes de publicarla en Storage. La imagen
 * no sale a ningún proveedor externo: la inferencia ocurre en el servidor de
 * Tuki.
 *
 * Si el servicio no está disponible, la subida no se bloquea: se devuelve
 * `revisada: false` y el formulario decide qué hacer. La disponibilidad del
 * panel pesa más que una comprobación que todavía puede fallar.
 */
import { ENV } from '../constantes';

const RUTA = '/api/v1/vision/clasificar';
const TIEMPO_LIMITE_MS = 20_000;

interface RespuestaVision {
  es_comida?: boolean;
  etiqueta?: string;
  confianza?: number;
  probabilidad_comida?: number;
  umbral?: number;
  modelo?: string;
}

export interface RevisionFoto {
  /** `false` cuando no se pudo consultar el servicio (red, 503, timeout). */
  revisada: boolean;
  esComida: boolean;
  /** Probabilidad de que la foto sea comida, entre 0 y 1. */
  probabilidadComida: number | null;
  etiqueta: string | null;
  mensaje: string;
}

const urlBase = (): string => (ENV.VISION_URL || '/vision').replace(/\/+$/, '');

const revisionNoDisponible = (mensaje: string): RevisionFoto => ({
  revisada: false,
  esComida: true,
  probabilidadComida: null,
  etiqueta: null,
  mensaje,
});

/**
 * Envía la foto al clasificador local.
 *
 * Nunca lanza: los errores se traducen a `revisada: false` para que el panel
 * pueda seguir funcionando. Un rechazo por contenido sí llega como
 * `revisada: true` con `esComida: false`.
 */
export const revisarFotoComida = async (archivo: File): Promise<RevisionFoto> => {
  const cuerpo = new FormData();
  cuerpo.append('imagen', archivo);

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_LIMITE_MS);

  try {
    const respuesta = await fetch(`${urlBase()}${RUTA}`, {
      method: 'POST',
      body: cuerpo,
      signal: control.signal,
    });

    if (!respuesta.ok) {
      return revisionNoDisponible(
        `El revisor de fotos no está disponible (${respuesta.status}).`
      );
    }

    const datos = (await respuesta.json()) as RespuestaVision;
    if (typeof datos.es_comida !== 'boolean') {
      return revisionNoDisponible('El revisor de fotos devolvió una respuesta inesperada.');
    }

    const probabilidad = datos.probabilidad_comida ?? datos.confianza ?? null;
    return {
      revisada: true,
      esComida: datos.es_comida,
      probabilidadComida: probabilidad,
      etiqueta: datos.etiqueta ?? null,
      mensaje: datos.es_comida
        ? 'La foto parece comida.'
        : 'La foto no parece comida.',
    };
  } catch (error: unknown) {
    const motivo =
      error instanceof DOMException && error.name === 'AbortError'
        ? 'El revisor de fotos tardó demasiado.'
        : 'No se pudo conectar con el revisor de fotos.';
    return revisionNoDisponible(motivo);
  } finally {
    clearTimeout(temporizador);
  }
};

/** Texto para el aviso de rechazo, con el porcentaje de seguridad. */
export const mensajeFotoRechazada = (revision: RevisionFoto): string => {
  const porcentaje =
    revision.probabilidadComida === null
      ? null
      : Math.round(revision.probabilidadComida * 100);
  const detalle = porcentaje === null ? '' : ` Solo un ${porcentaje} % parece comida.`;
  return `Esa foto no parece comida.${detalle} Sube una foto clara del plato.`;
};
