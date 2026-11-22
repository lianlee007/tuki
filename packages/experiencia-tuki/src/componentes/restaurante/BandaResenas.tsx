import React from 'react';
import { ArrowRight, PenLine, Star } from 'lucide-react';
import { Avatar } from '../sistema-diseno/Avatar';
import { Estrellas } from '../sistema-diseno/Estrellas';
import { ImagenInteligente } from '../sistema-diseno/ImagenInteligente';
import { fechaResena, nombreCliente, type Resena, type ResumenResenas } from '../../modulos/resenas';
import type { PaletaDerivada } from '../../lib/color';
import type { EstilosComunes } from './plantillas/tipos';

interface BandaResenasProps {
  resenas: Resena[];
  resumen: ResumenResenas;
  cargando: boolean;
  error: string | null;
  /** Capa semántica de color del tema, igual que en el resto de la ficha. */
  estilos: EstilosComunes;
  paleta: PaletaDerivada;
  /** Lleva a la sección completa de reseñas, al final de la página. */
  onVerTodas: () => void;
  /** Abre el formulario de reseña. */
  onEscribir: () => void;
}

/**
 * Banda de reseñas: resume la reputación del restaurante justo después de la
 * franja de información, antes del menú. La sección completa sigue al final,
 * pero aquí el visitante ve la nota, dos opiniones recientes y los accesos sin
 * tener que recorrer toda la carta.
 *
 * Va sobre una tarjeta de superficie opaca: nada de velos ni fondos oscuros.
 */
export const BandaResenas: React.FC<BandaResenasProps> = ({
  resenas,
  resumen,
  cargando,
  error,
  estilos,
  paleta,
  onVerTodas,
  onEscribir,
}) => {
  if (cargando || error) return null;

  const hayResumen = resumen.cantidad > 0;
  const recientes = resenas.filter((r) => r.comentario?.trim()).slice(0, 2);

  return (
    <section aria-labelledby="banda-resenas" className="relative z-10 pt-12 sm:pt-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="overflow-hidden rounded-[26px] border p-5 sm:p-7 lg:p-9"
          style={{ backgroundColor: paleta.surface, borderColor: paleta.border }}
        >
          <div className="grid gap-7 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] lg:items-center lg:gap-9">
            <div>
              <p
                className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{ color: estilos.accentText }}
              >
                <Star size={12} aria-hidden="true" /> Reseñas
              </p>

              <h2 id="banda-resenas" className="sr-only">
                Reseñas del restaurante
              </h2>

              {hayResumen ? (
                <div className="mt-3 flex items-end gap-3">
                  <span
                    className="font-title text-[3.25rem] font-bold leading-none tabular-nums tracking-tight"
                    style={{ color: paleta.title }}
                  >
                    {resumen.promedio.toFixed(1)}
                  </span>
                  <div className="pb-1">
                    <Estrellas
                      valor={resumen.promedio}
                      tamano={16}
                      className="text-af-accent-text"
                    />
                    <p className="mt-1 text-xs" style={{ color: paleta.muted }}>
                      {resumen.cantidad === 1 ? '1 reseña' : `${resumen.cantidad} reseñas`}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-relaxed" style={{ color: paleta.muted }}>
                  Este restaurante aún no tiene reseñas.
                </p>
              )}
            </div>

            {recientes.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {recientes.map((resena, indice) => {
                  const autor = nombreCliente(resena);
                  return (
                    <figure
                      key={resena.id}
                      className={`flex h-full flex-col rounded-2xl px-4 py-3.5 ${indice > 0 ? 'hidden sm:flex' : ''}`}
                      style={{ backgroundColor: paleta.bg, border: `1px solid ${paleta.border}` }}
                    >
                      <div className="flex items-center gap-2">
                        <Estrellas
                          valor={resena.calificacion}
                          tamano={12}
                          className="text-af-accent-text"
                        />
                        <span className="ml-auto shrink-0 text-[11px]" style={{ color: paleta.muted }}>
                          {fechaResena(resena.created_at) || 'Hace poco'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-start gap-3">
                        <blockquote
                          className="line-clamp-3 min-w-0 flex-1 text-sm leading-relaxed"
                          style={{ color: paleta.text }}
                        >
                          «{resena.comentario}»
                        </blockquote>
                        {resena.foto_url && (
                          <ImagenInteligente
                            src={resena.foto_url}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-xl object-cover"
                          />
                        )}
                      </div>
                      <figcaption className="mt-auto flex items-center gap-2 pt-3">
                        <Avatar nombre={autor} tamano={22} src={resena.foto_autor_url} />
                        <span className="truncate text-xs font-semibold" style={{ color: paleta.muted }}>
                          {autor}
                        </span>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: paleta.muted }}>
                Si ya pediste aquí, cuéntale a los demás cómo estuvo. Tu opinión
                ayuda a quien está decidiendo dónde comer.
              </p>
            )}

            <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col lg:items-stretch">
              {hayResumen && (
                <button
                  type="button"
                  onClick={onVerTodas}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold af-pulsar"
                  style={{ backgroundColor: estilos.primary, color: estilos.onPrimary }}
                >
                  Ver {resumen.cantidad === 1 ? 'la reseña' : 'las reseñas'}
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={onEscribir}
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold af-pulsar"
                style={{
                  backgroundColor: 'transparent',
                  color: paleta.text,
                  border: `1px solid ${paleta.border}`,
                }}
              >
                <PenLine size={15} aria-hidden="true" />
                Escribir la tuya
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
