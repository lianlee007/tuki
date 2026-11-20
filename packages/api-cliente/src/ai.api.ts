import type { ClienteHttp } from './http.js';

export type RolMensajeIa = 'user' | 'assistant';

export interface MensajeIa {
  rol: RolMensajeIa;
  contenido: string;
}

export interface FuenteIa {
  id: string;
  tipo: 'plato' | 'restaurante';
  nombre: string;
  restaurante: string;
  restauranteSlug: string;
  ciudad?: string | null;
  categoria?: string | null;
  precio?: number | null;
  moneda: string;
  imagenUrl?: string | null;
  vegetariano: boolean;
  vegano: boolean;
  picante: boolean;
  alergenos: string[];
}

export interface RecomendacionIa {
  respuesta: string;
  fuentes: FuenteIa[];
  modelo: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  attempts: number;
  latencyMs: number;
  recuperacionMs: number;
  contextoTokens: number;
  requestId: string;
}

export interface EntradaRecomendacion {
  mensaje: string;
  historial?: MensajeIa[];
  ciudad?: string | null;
  restauranteSlug?: string | null;
}

interface FuenteCruda {
  id: string;
  tipo: 'plato' | 'restaurante';
  nombre: string;
  restaurante: string;
  restaurante_slug: string;
  ciudad?: string | null;
  categoria?: string | null;
  precio?: number | null;
  moneda?: string;
  imagen_url?: string | null;
  vegetariano?: boolean;
  vegano?: boolean;
  picante?: boolean;
  alergenos?: string[];
}

interface RecomendacionCruda {
  respuesta: string;
  fuentes: FuenteCruda[];
  modelo: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  attempts: number;
  latency_ms: number;
  recuperacion_ms: number;
  contexto_tokens: number;
  request_id: string;
}

/** Contrato del AI Gateway local (RAG sobre el catálogo de restaurantes). */
export const crearApiIa = (http: ClienteHttp) => ({
  recomendar: async (entrada: EntradaRecomendacion): Promise<RecomendacionIa> => {
    const datos = await http.solicitar<RecomendacionCruda>('/api/v1/ai/recomendar', {
      method: 'POST',
      body: JSON.stringify({
        mensaje: entrada.mensaje,
        historial: entrada.historial ?? [],
        ...(entrada.ciudad ? { ciudad: entrada.ciudad } : {}),
        ...(entrada.restauranteSlug ? { restaurante_slug: entrada.restauranteSlug } : {}),
      }),
    });

    return {
      respuesta: datos.respuesta,
      fuentes: (datos.fuentes ?? []).map((fuente) => ({
        id: fuente.id,
        tipo: fuente.tipo,
        nombre: fuente.nombre,
        restaurante: fuente.restaurante,
        restauranteSlug: fuente.restaurante_slug,
        ciudad: fuente.ciudad ?? null,
        categoria: fuente.categoria ?? null,
        precio: fuente.precio ?? null,
        moneda: fuente.moneda ?? 'COP',
        imagenUrl: fuente.imagen_url ?? null,
        vegetariano: Boolean(fuente.vegetariano),
        vegano: Boolean(fuente.vegano),
        picante: Boolean(fuente.picante),
        alergenos: fuente.alergenos ?? [],
      })),
      modelo: datos.modelo,
      usage: {
        promptTokens: datos.usage?.prompt_tokens ?? 0,
        completionTokens: datos.usage?.completion_tokens ?? 0,
        totalTokens: datos.usage?.total_tokens ?? 0,
      },
      attempts: datos.attempts,
      latencyMs: datos.latency_ms,
      recuperacionMs: datos.recuperacion_ms,
      contextoTokens: datos.contexto_tokens,
      requestId: datos.request_id,
    };
  },
});
