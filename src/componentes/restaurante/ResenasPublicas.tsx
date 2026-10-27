import React, { useMemo, useState } from 'react';
import { MessageSquare, PenLine, RefreshCw } from 'lucide-react';
import { Avatar } from '../sistema-diseno/Avatar';
import { Estrellas } from '../sistema-diseno/Estrellas';
import {
  fechaResena,
  nombreCliente,
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
            {!formularioAbierto && (
              <button
                type="button"
                onClick={onAbrirFormulario}
                className="mt-5 rounded-full bg-af-ink px-5 py-2.5 text-sm font-semibold text-af-ground af-pulsar"
              >
                Escribir la primera reseña
              </button>
            )}
          </div>
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

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-af-ground px-2.5 py-1 text-[11px] font-semibold text-af-ink-secondary">
                        {plato ? `Sobre ${plato}` : 'Sobre el restaurante'}
                      </span>
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
    </section>
  );
};
