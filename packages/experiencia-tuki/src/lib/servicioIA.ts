/**
 * Descripción: Servicio de IA del panel. Habla con el AI Gateway de TukiTuki,
 * que usa Ollama local.
 *
 * No hay claves de terceros en el bundle: el gateway valida la sesión cuando
 * existe, aplica el límite de solicitudes y decide el modelo.
 */
import { ENV } from '../constantes';
import { leerTokens } from '@tuki/auth-react';
import { urlGatewaysIa } from './api-tuki';

const RUTA_CHAT = '/api/v1/ai/chat';
const TIEMPO_LIMITE_MS = 45_000;

const SISTEMA_POR_DEFECTO =
  'Eres un experto en marketing gastronómico de lujo y copywriting persuasivo. ' +
  'Respondes siempre en español, de forma breve y concreta, sin comillas, sin markdown y sin explicaciones.';

interface ErrorGateway {
  detail?: { code?: string; message?: string } | string;
  request_id?: string;
}

interface RespuestaGateway {
  content?: string;
  model?: string;
  request_id?: string;
}

/**
 * Quita comillas, bloques de código y etiquetas que la IA suele añadir
 * ("Eslogan: ...", ``` ... ```, comillas tipográficas, etc.).
 */
const limpiarSalida = (texto: string): string =>
  texto
    .replace(/```[a-z]*\s*/gi, '')
    .replace(/```/g, '')
    .replace(
      /^\s*(eslogan|descripci[oó]n|nombre|categor[ií]a|ingredientes|respuesta|resultado)\s*:\s*/i,
      ''
    )
    .replace(/^["'“”«»]+|["'“”«»]+$/g, '')
    .trim();

const urlBase = (): string => (urlGatewaysIa() || ENV.AI_GATEWAY_URL).replace(/\/+$/, '');

/** El token es opcional: sin sesión, el gateway aplica la cuota anónima por IP. */
const tokenDeSesion = async (): Promise<string | null> => {
  try {
    return leerTokens().accessToken ?? null;
  } catch {
    return null;
  }
};

const mensajeDeError = (status: number, data: ErrorGateway | null): string => {
  const detalle = data?.detail;
  const codigo = typeof detalle === 'object' && detalle ? detalle.code : undefined;
  const mensaje =
    typeof detalle === 'string'
      ? detalle
      : typeof detalle === 'object' && detalle
        ? detalle.message || ''
        : '';

  switch (codigo) {
    case 'rate_limited':
    case 'ai_rate_limited':
      return 'La IA está recibiendo demasiadas solicitudes. Espera unos segundos e inténtalo de nuevo.';
    case 'auth_required':
      return 'Inicia sesión para usar la IA.';
    case 'prompt_too_long':
      return 'El texto es demasiado largo para la IA. Acórtalo e inténtalo de nuevo.';
    case 'ai_not_configured':
      return 'La IA no está configurada en el servidor.';
    case 'ai_timeout':
      return 'La IA tardó demasiado en responder. Inténtalo de nuevo.';
    default:
      break;
  }

  if (status === 429) {
    return 'La IA está recibiendo demasiadas solicitudes. Espera unos segundos e inténtalo de nuevo.';
  }
  if (status === 503) {
    return 'La IA no está disponible en este momento. Inténtalo más tarde.';
  }
  return mensaje || `Error de IA (${status}).`;
};

export const generarTextoIA = async (
  mensajeUsuario: string,
  mensajeSistema: string = SISTEMA_POR_DEFECTO
): Promise<string> => {
  const controller = new AbortController();
  const temporizador = setTimeout(() => controller.abort(), TIEMPO_LIMITE_MS);

  try {
    const token = await tokenDeSesion();
    const response = await fetch(`${urlBase()}${RUTA_CHAT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        prompt: mensajeUsuario,
        system: mensajeSistema,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as ErrorGateway | null;
      throw new Error(mensajeDeError(response.status, data));
    }

    const data = (await response.json()) as RespuestaGateway;
    const limpio = limpiarSalida(data.content || '');

    if (limpio) return limpio;
    throw new Error('La IA no devolvió contenido. Inténtalo de nuevo.');
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La IA tardó demasiado en responder. Inténtalo de nuevo.', { cause: error });
    }
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con el servicio de IA. Revisa tu conexión.', { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(temporizador);
  }
};
