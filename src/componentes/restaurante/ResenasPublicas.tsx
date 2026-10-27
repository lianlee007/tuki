import React, { useMemo, useState } from 'react';
import { Image as ImageIcon, MessageSquare, PenLine, RefreshCw, Store, X } from 'lucide-react';
import { Avatar } from '../sistema-diseno/Avatar';
import { Estrellas } from '../sistema-diseno/Estrellas';
import { ImagenInteligente } from '../sistema-diseno/ImagenInteligente';
import {
  fechaResena,
  nombreCliente,
  tieneRespuesta,
  type Resena,
  type ResumenResenas,
} from '../../lib/resenas';
import type { Platillo } from '../../tipos/modelos';
import type { EstilosComunes } from './PlantillaRestaurante';
import { FormularioResena } from './FormularioResena';

interface ResenasPublicasProps {
  restauranteId: string;
  platillos: Platillo[];
  resenas: Resena[];
  resumen: ResumenResenas;
  cargando: boolean;
  error: string | null;
  onRecargar: () => void;
  formularioAbierto: boolean;
  onAbrirFormulario: () => void;
  onCerrarFormulario: () => void;
  platilloInicialId?: string | null;
  estilos: EstilosComunes;
}

const ANCHO = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

/**
 * La sección pública de reseñas.
 *
 * Vive después del menú y antes del pie: primero se come, después se opina. La
 * lista y el formulario comparten el mismo espacio para que el comensal no
 * pierda de vista lo que ya dijeron los demás.
 */
export const ResenasPublicas: React.FC<ResenasPublicasProps> = ({
  restauranteId,
  platillos,
  resenas,
  resumen,
  cargando,
  error,
  onRecargar,
  formularioAbierto,
  onAbrirFormulario,
  onCerrarFormulario,
  platilloInicialId,
  estilos,
}) => {
  const [verTodas, setVerTodas] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  /**
   * El visor de fotos se cierra con Escape: en escritorio el usuario no
   * espera tener que apuntar al aspa después de abrir una imagen a pantalla
   * completa.
   */
  React.useEffect(() => {
    if (!fotoAmpliada) return;
    const cerrar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setFotoAmpliada(null);
    };
    window.addEventListener('keydown', cerrar);
    return () => window.removeEventListener('keydown', cerrar);
  }, [fotoAmpliada]);

  const nombresPlatos = useMemo(() => {
    const mapa = new Map<string, string>();
    platillos.forEach((platillo) => mapa.set(platillo.id, platillo.nombre));
    return mapa;
  }, [platillos]);

  const visibles = verTodas ? resenas : resenas.slice(0, 6);
  const hayResumen = resumen.cantidad > 0;

  return (
    <section id="resenas" className="af-ancla relative z-10 border-t border-af/15 py-14 sm:py-20">
      <div className={ANCHO}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-af-ink font-title sm:text-3xl">
              Lo que dice la gente
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              {cargando ? (
                <span className="h-5 w-40 animate-pulse rounded-full bg-af-surface" />
              ) : hayResumen ? (
                <>
                  <Estrellas
                    valor={resumen.promedio}
                    cantidad={resumen.cantidad}
                    conNumero
                    tamano={17}
                    className="text-af-accent-text"
                  />
                  <span className="text-sm text-af-ink-secondary">
                    {resumen.cantidad === 1 ? '1 reseña' : `${resumen.cantidad} reseñas`}
                  </span>
                </>
              ) : (
                <span className="text-sm text-af-ink-secondary">
                  Todavía no hay reseñas publicadas.
                </span>
              )}
            </div>
          </div>

          {!formularioAbierto && (
            <button
              type="button"
              onClick={onAbrirFormulario}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 af-pulsar"
              style={{ backgroundColor: estilos.primary, color: estilos.onPrimary }}
            >
              <PenLine size={16} />
              Escribir reseña
            </button>
          )}
        </div>

        {hayResumen && !cargando && (
          <div className="mt-7 grid gap-5 rounded-[22px] bg-af-surface p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-6">
            <div className="flex items-center gap-4 sm:border-r sm:border-af/20 sm:pr-7">
              <span className="text-4xl font-bold tabular-nums leading-none text-af-ink">
                {resumen.promedio.toFixed(1)}
              </span>
              <div>
                <Estrellas
                  valor={resumen.promedio}
                  tamano={15}
                  className="text-af-accent-text"
                />
                <p className="mt-1 text-xs text-af-ink-secondary">
                  {resumen.cantidad === 1 ? '1 reseña' : `${resumen.cantidad} reseñas`}
                </p>
              </div>
            </div>

            <ul className="space-y-1.5" aria-label="Distribución de las notas">
              {[5, 4, 3, 2, 1].map((nota) => {
                const cuantas = resumen.distribucion[nota - 1] ?? 0;
                const porcentaje =
                  resumen.cantidad > 0 ? Math.round((cuantas / resumen.cantidad) * 100) : 0;
                return (
                  <li key={nota} className="flex items-center gap-2.5 text-xs">
                    <span className="w-3 text-right font-semibold tabular-nums text-af-ink-secondary">
                      {nota}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-af-ground">
                      <span
                        className="block h-full rounded-full transition-[width] duration-500"
                        style={{
                          width: `${porcentaje}%`,
                          backgroundColor: estilos.primary,
                        }}
                      />
                    </span>
                    <span className="w-8 tabular-nums text-af-ink-secondary">
                      {cuantas}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {formularioAbierto && (
          <div className="mt-7">
            <FormularioResena
              restauranteId={restauranteId}
              platillos={platillos}
              platilloInicialId={platilloInicialId}
              estilos={estilos}
              onEnviada={onRecargar}
              onCancelar={onCerrarFormulario}
            />
          </div>
        )}

        {error ? (
          <div className="mt-8 rounded-[22px] bg-af-surface px-6 py-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-af-ground text-af-ink-secondary">
              <RefreshCw size={22} />
            </span>
            <p className="mt-3 text-base font-semibold text-af-ink">
              No pudimos cargar las reseñas
            </p>
            <p className="mt-1 text-sm text-af-ink-secondary">
              Es un problema momentáneo. Inténtalo otra vez.
            </p>
            <button
              type="button"
              onClick={onRecargar}
              className="mt-5 rounded-full bg-af-ink px-5 py-2.5 text-sm font-semibold text-af-ground af-pulsar"
            >
              Reintentar
            </button>
          </div>
        ) : cargando ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2" aria-hidden="true">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="rounded-[22px] bg-af-surface p-5">
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-af-ground" />
                  <span className="h-3 w-32 rounded-full bg-af-ground" />
                </div>
                <span className="mt-5 block h-3 w-3/4 rounded-full bg-af-ground" />
                <span className="mt-2 block h-3 w-1/2 rounded-full bg-af-ground" />
              </div>
            ))}
          </div>
        ) : resenas.length === 0 ? (
          !formularioAbierto && (
            <div className="mt-8 rounded-[22px] bg-af-surface px-6 py-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-af-ground text-af-ink-secondary">
                <MessageSquare size={22} />
              </span>
              <p className="mt-3 text-base font-semibold text-af-ink">
                Aún no hay reseñas
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-af-ink-secondary">
                Si ya pediste, cuéntale a los demás cómo estuvo. Es la primera
                reseña de este restaurante.
              </p>
              <button
                type="button"
                onClick={onAbrirFormulario}
                className="mt-5 rounded-full bg-af-ink px-5 py-2.5 text-sm font-semibold text-af-ground af-pulsar"
              >
                Escribir la primera reseña
              </button>
            </div>
          )
        ) : (
          <>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {visibles.map((resena) => {
                const autor = nombreCliente(resena);
                const plato = resena.platillo_id
                  ? nombresPlatos.get(resena.platillo_id)
                  : null;

                return (
                  <li key={resena.id} className="rounded-[22px] bg-af-surface p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <Avatar nombre={autor} tamano={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-af-ink">
                          {autor}
                        </p>
                        <p className="mt-0.5 text-xs text-af-ink-secondary">
                          {fechaResena(resena.created_at) || 'Hace poco'}
                        </p>
                      </div>
                      <Estrellas
                        valor={resena.calificacion}
                        tamano={13}
                        className="shrink-0 text-af-accent-text"
                      />
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-af-ink whitespace-pre-line">
                      {resena.comentario?.trim() || 'Calificó sin dejar comentario.'}
                    </p>

                    {resena.foto_url && (
                      <button
                        type="button"
                        onClick={() => setFotoAmpliada(resena.foto_url ?? null)}
                        className="mt-4 block w-full overflow-hidden rounded-2xl border border-af/20 af-pulsar"
                        aria-label={`Ampliar la foto de la reseña de ${autor}`}
                      >
                        <ImagenInteligente
                          src={resena.foto_url}
                          alt={`Foto de la reseña de ${autor}`}
                          className="aspect-[4/3] w-full"
                        />
                      </button>
                    )}

                    {tieneRespuesta(resena) && (
                      <div className="mt-4 rounded-xl bg-af-ground px-3.5 py-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-af-ink-secondary">
                          <Store size={13} /> Respuesta del restaurante
                        </p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-af-ink">
                          {resena.respuesta_dueno}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-af-ground px-2.5 py-1 text-[11px] font-semibold text-af-ink-secondary">
                        {plato ? `Sobre ${plato}` : 'Sobre el restaurante'}
                      </span>
                      {resena.foto_url && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-af-ground px-2.5 py-1 text-[11px] font-semibold text-af-ink-secondary">
                          <ImageIcon size={12} /> Con foto
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {resenas.length > 6 && (
              <div className="mt-7 text-center">
                <button
                  type="button"
                  onClick={() => setVerTodas((valor) => !valor)}
                  className="rounded-full bg-af-surface px-5 py-2.5 text-sm font-semibold text-af-ink transition-colors hover:bg-af-surface/70 af-pulsar"
                >
                  {verTodas ? 'Ver menos' : `Ver las ${resenas.length} reseñas`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {fotoAmpliada && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto de la reseña"
          onClick={() => setFotoAmpliada(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <img
            src={fotoAmpliada}
            alt="Foto de la reseña ampliada"
            onClick={(evento) => evento.stopPropagation()}
            className="max-h-[86vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setFotoAmpliada(null)}
            aria-label="Cerrar la foto"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 af-pulsar"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </section>
  );
};
