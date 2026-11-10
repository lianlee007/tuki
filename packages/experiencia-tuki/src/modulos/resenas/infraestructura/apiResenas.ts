import { apis, aResena, intentar } from '../../../lib/api-tuki';
import type { Resena } from '../dominio/resenas';

/** Reseña con el restaurante al que pertenece, tal como la usa «Mi cuenta». */
export type ResenaConRestaurante = Resena & {
  restaurante: {
    id: string;
    nombre: string;
    imagen_logo_url: string | null;
    ciudad: string | null;
  } | null;
};

/**
 * «Es útil» se recuerda por cuenta en el navegador.
 *
 * El servicio guarda el conteo global; saber qué marcó cada persona exige una
 * consulta por usuario que el contrato actual no expone. Para la interfaz basta
 * con recordarlo localmente y mantener el conteo del servidor como fuente.
 */
const claveUtiles = (usuarioId: string) => `tuki.resenas.utiles.${usuarioId}`;

const leerUtiles = (usuarioId: string): string[] => {
  try {
    const crudo = localStorage.getItem(claveUtiles(usuarioId));
    const lista = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
};

const guardarUtiles = (usuarioId: string, ids: string[]) => {
  try {
    localStorage.setItem(claveUtiles(usuarioId), JSON.stringify(ids));
  } catch {
    // Sin almacenamiento (modo privado) el botón sigue funcionando en memoria.
  }
};

/** Completa el nombre del restaurante para «Mi cuenta». */
const conRestaurante = async (resenas: Resena[]): Promise<ResenaConRestaurante[]> => {
  const ids = [
    ...new Set(resenas.map((resena) => resena.restaurante_id).filter(Boolean)),
  ] as string[];
  const cache = new Map<string, ResenaConRestaurante['restaurante']>();

  await Promise.all(
    ids.map(async (restauranteId) => {
      const { data } = await intentar(() => apis.restaurantes.menuPublico(restauranteId));
      cache.set(
        restauranteId,
        data?.restaurante
          ? {
              id: data.restaurante.id,
              nombre: data.restaurante.nombre,
              imagen_logo_url: null,
              ciudad: null,
            }
          : null,
      );
    }),
  );

  return resenas.map((resena) => ({
    ...resena,
    restaurante: resena.restaurante_id
      ? (cache.get(resena.restaurante_id) ?? null)
      : null,
  }));
};

export const apiResenas = {
  listar: async (restauranteId: string) => {
    const { data, error } = await intentar(() => apis.resenas.listar(restauranteId));
    return { resenas: (data?.resenas ?? []).map(aResena), error };
  },

  mias: async (_usuarioId: string) => {
    const { data, error } = await intentar(() => apis.resenas.mias());
    const propias = (data?.resenas ?? []).map(aResena);
    return {
      resenas: error ? [] : await conRestaurante(propias),
      error,
    };
  },

  crear: async (entrada: {
    restauranteId: string;
    platilloId?: string | null;
    calificacion: number;
    comentario: string;
    nombre: string;
    email?: string | null;
    fotoUrl?: string | null;
    fotoAutorUrl?: string | null;
  }) => {
    const { error } = await intentar(() =>
      apis.resenas.crear({
        restauranteId: entrada.restauranteId,
        platilloId: entrada.platilloId || null,
        nombreCliente: entrada.nombre.trim() || 'Comensal',
        calificacion: entrada.calificacion,
        comentario: entrada.comentario.trim() || undefined,
        fotoUrl: entrada.fotoUrl || null,
      }),
    );

    return { error, publicada: !error };
  },

  /** Respuesta pública del dueño. `null` la borra. */
  responder: async (id: string, respuesta: string | null) => {
    const texto = respuesta?.trim();
    if (!texto) return intentar(() => apis.resenas.borrarRespuesta(id));
    return intentar(() => apis.resenas.responder(id, texto));
  },

  eliminar: async (id: string) => {
    return intentar(() => apis.resenas.eliminar(id));
  },

  utilesDe: async (resenaIds: string[], usuarioId: string) => {
    const marcadas = new Set(leerUtiles(usuarioId));
    return { ids: resenaIds.filter((id) => marcadas.has(id)), error: null };
  },

  alternarUtil: async (resenaId: string, usuarioId: string, yaUtil: boolean) => {
    const marcadas = new Set(leerUtiles(usuarioId));

    if (yaUtil) {
      const { error } = await intentar(() => apis.resenas.quitarUtil(resenaId));
      if (!error) {
        marcadas.delete(resenaId);
        guardarUtiles(usuarioId, [...marcadas]);
      }
      return { error, activo: false };
    }

    const { error } = await intentar(() => apis.resenas.marcarUtil(resenaId));
    if (!error) {
      marcadas.add(resenaId);
      guardarUtiles(usuarioId, [...marcadas]);
    }
    return { error, activo: !error };
  },
};
