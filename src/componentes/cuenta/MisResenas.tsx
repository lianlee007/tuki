import React, { useCallback, useEffect, useState } from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Image as ImageIcon,
  MessageSquare,
  RefreshCw,
  Store,
  Trash2,
} from 'lucide-react';
import { Estrellas } from '../sistema-diseno/Estrellas';
import { ImagenInteligente } from '../sistema-diseno/ImagenInteligente';
import { apiResenas, type ResenaConRestaurante } from '../../api/apiResenas';
import { esPublica, fechaResena, tieneRespuesta } from '../../lib/resenas';
import { generarSlugUnico } from '../../lib/utils';

interface Props {
  usuarioId: string;
}

const CTA_BOTON =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-af-ink px-4 py-2.5 text-sm font-semibold text-af-ground transition-opacity hover:opacity-90 af-pulsar';

/**
 * Historial de reseñas del comensal.
 *
 * La política de lectura deja ver las propias aunque sigan pendientes, así que
 * aquí se muestra el estado real: «Pendiente» o «Publicada». El comensal puede
 * borrar su reseña; el dueño solo la modera, nunca la borra.
 */
export const MisResenas: React.FC<Props> = ({ usuarioId }) => {
  const [resenas, setResenas] = useState<ResenaConRestaurante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { resenas: encontradas, error: fallo } = await apiResenas.mias(usuarioId);
      if (fallo) throw fallo;
      setResenas(encontradas);
    } catch {
      setError('No pudimos cargar tus reseñas. Inténtalo otra vez.');
      setResenas([]);
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const borrar = async (resena: ResenaConRestaurante) => {
    const anteriores = resenas;
    setBorrando(resena.id);
    setResenas((prev) => prev.filter((item) => item.id !== resena.id));
    try {
      const { error: fallo } = await apiResenas.eliminar(resena.id);
      if (fallo) throw fallo;
      setConfirmando(null);
    } catch {
      setResenas(anteriores);
      setError('No pudimos borrar la reseña. Inténtalo otra vez.');
    } finally {
      setBorrando(null);
    }
  };

  if (cargando) {
    return (
      <div className="space-y-3" aria-hidden="true">
        {[1, 2].map((item) => (
          <div key={item} className="rounded-[20px] bg-af-surface p-5">
            <span className="block h-3 w-40 rounded-full bg-af-ground" />
            <span className="mt-4 block h-3 w-2/3 rounded-full bg-af-ground" />
          </div>
        ))}
      </div>
    );
  }

  if (error && resenas.length === 0) {
    return (
      <div className="rounded-2xl bg-af-surface px-6 py-10 text-center">
        <p className="text-base font-semibold text-af-ink">{error}</p>
        <button type="button" onClick={cargar} className={`mt-4 ${CTA_BOTON}`}>
          <RefreshCw size={16} /> Reintentar
        </button>
      </div>
    );
  }

  if (resenas.length === 0) {
    return (
      <div className="rounded-2xl bg-af-surface px-6 py-12 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-af-ground text-af-ink-secondary">
          <MessageSquare size={22} />
        </span>
        <p className="mt-3 text-base font-semibold text-af-ink">
          Todavía no has reseñado nada
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-af-ink-secondary">
          Cuando pidas en un restaurante, cuéntale a los demás cómo estuvo. La
          reseña lleva estrellas, texto y una foto si quieres.
        </p>
        <Link to="/" className={`mt-5 ${CTA_BOTON}`}>
          Explorar restaurantes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm font-medium text-af-danger-text">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {resenas.map((resena) => {
          const publica = esPublica(resena);
          const restaurante = resena.restaurante;
          const enlace = restaurante
            ? `/restaurante/${generarSlugUnico(restaurante.nombre, restaurante.id)}#resenas`
            : null;

          return (
            <li key={resena.id} className="rounded-[20px] bg-af-surface p-5">
              <div className="flex flex-wrap items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-af-ground text-sm font-bold text-af-ink-secondary">
                  {restaurante?.imagen_logo_url ? (
                    <ImagenInteligente
                      src={restaurante.imagen_logo_url}
                      alt=""
                      className="h-full w-full"
                    />
                  ) : (
                    (restaurante?.nombre?.charAt(0) ?? 'R').toUpperCase()
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-af-ink">
                    {restaurante?.nombre ?? 'Restaurante'}
                  </p>
                  <p className="mt-0.5 text-xs text-af-ink-secondary">
                    {fechaResena(resena.created_at) || 'Hace poco'}
                    {restaurante?.ciudad ? ` · ${restaurante.ciudad}` : ''}
                  </p>
                </div>

                <Estrellas
                  valor={resena.calificacion}
                  tamano={14}
                  className="shrink-0 text-af-accent-text"
                />
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    publica
                      ? 'bg-af-success/15 text-af-success'
                      : 'bg-af-accent/10 text-af-accent-text'
                  }`}
                >
                  {publica ? 'Publicada' : 'Pendiente'}
                </span>
              </div>

              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-af-ink">
                {resena.comentario?.trim() || 'Calificaste sin dejar comentario.'}
              </p>

              {resena.foto_url && (
                <a
                  href={resena.foto_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 overflow-hidden rounded-xl border border-af/20 af-pulsar"
                >
                  <img
                    src={resena.foto_url}
                    alt="Foto de tu reseña"
                    loading="lazy"
                    className="h-20 w-28 object-cover"
                  />
                  <span className="inline-flex items-center gap-1 pr-3 text-[11px] font-semibold text-af-ink-secondary">
                    <ImageIcon size={13} /> Ver foto
                  </span>
                </a>
              )}

              {tieneRespuesta(resena) && (
                <div className="mt-4 rounded-xl bg-af-ground px-3.5 py-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-af-ink-secondary">
                    <Store size={13} /> Respondió el restaurante
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-af-ink">
                    {resena.respuesta_dueno}
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-af/15 pt-4">
                {enlace && (
                  <Link
                    to={enlace}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-af-ink-secondary transition-colors hover:bg-af-ink/5 hover:text-af-ink af-pulsar"
                  >
                    <ExternalLink size={14} /> Ver en la ficha
                  </Link>
                )}

                {confirmando === resena.id ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xs font-semibold text-af-ink-secondary">
                      ¿Borrar tu reseña?
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmando(null)}
                      className="rounded-xl px-3 py-2 text-xs font-semibold text-af-ink-secondary hover:text-af-ink af-pulsar"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => borrar(resena)}
                      disabled={borrando === resena.id}
                      className="rounded-xl bg-af-danger px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 af-pulsar"
                    >
                      {borrando === resena.id ? 'Borrando…' : 'Sí, borrar'}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmando(resena.id)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-af-danger-text transition-colors hover:bg-af-danger/10 af-pulsar"
                  >
                    <Trash2 size={14} /> Borrar
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
