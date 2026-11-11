import React from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, Sparkles, Trash2, X } from 'lucide-react';
import type { PlatoDescubierto } from '../../tipos/modelos';
import { formatearPrecio, generarSlug } from '../../lib/utils';
import { FOCO, TARJETA } from '../descubrir/estilos';

interface PanelEnVivoProps {
  aprobados: PlatoDescubierto[];
  onQuitar: (plato: PlatoDescubierto) => void;
  onVaciar: () => void;
}

/**
 * «Inspiración en vivo».
 *
 * El historial de lo aprobado durante la sesión, no una segunda lista de
 * favoritos escondida: cada tarjeta que cruza a la derecha aparece aquí con su
 * foto, su restaurante y su precio. Quitar una devuelve el plato al olvido y lo
 * saca de favoritos. En móvil se lee debajo de la baraja; en escritorio sostiene
 * la columna derecha.
 */
export const PanelEnVivo: React.FC<PanelEnVivoProps> = ({
  aprobados,
  onQuitar,
  onVaciar,
}) => {
  const cantidad = aprobados.length;

  return (
    <section aria-labelledby="titulo-en-vivo" className={`${TARJETA} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-bold text-hearth-honey-ink dark:text-hearth-night-honey-ink">
            <span className="relative flex h-2.5 w-2.5">
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-hearth-honey" />
            </span>
            Inspiración en vivo
          </p>
          <h2
            id="titulo-en-vivo"
            className="mt-1.5 font-jakarta text-lg font-extrabold tracking-[-0.02em] text-hearth-espresso dark:text-hearth-night-ink"
          >
            {cantidad === 0
              ? 'Tu lista espera'
              : cantidad === 1
                ? '1 antojo guardado'
                : `${cantidad} antojos guardados`}
          </h2>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-hearth-terracotta-soft px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink">
          <Heart size={11} aria-hidden="true" className="fill-current" />
          {cantidad}
        </span>
      </div>

      {cantidad === 0 ? (
        <div className="mt-5 flex flex-col items-center rounded-2xl bg-hearth-oat/70 px-4 py-7 text-center dark:bg-hearth-night-oat/70">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-hearth-card text-hearth-terracotta-ink shadow-warm dark:bg-hearth-night-card dark:text-hearth-night-terracotta-ink">
            <Heart size={22} aria-hidden="true" />
          </span>
          <p className="mt-3 font-jakarta text-sm font-extrabold text-hearth-espresso dark:text-hearth-night-ink">
            Aquí vive lo que te antoja
          </p>
          <p className="mt-1 max-w-[220px] text-[11.5px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
            Desliza una tarjeta a la derecha o toca el corazón y aparecerá en
            esta lista.
          </p>
        </div>
      ) : (
        <>
          <ul
            aria-live="polite"
            className="af-sin-scrollbar mt-4 max-h-[min(46vh,420px)] space-y-2 overflow-y-auto pr-0.5"
          >
            {aprobados.map((plato) => (
              <li key={plato.id}>
                <div className="group flex items-center gap-2.5 rounded-2xl bg-hearth-cream/80 p-2 ring-1 ring-hearth-line/60 transition-colors hover:bg-hearth-oat/70 dark:bg-hearth-night/60 dark:ring-hearth-night-line/70 dark:hover:bg-hearth-night-oat/70">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-hearth-oat dark:bg-hearth-night-oat">
                    {plato.imagen_url ? (
                      <img
                        src={plato.imagen_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-hearth-pebble dark:text-hearth-night-pebble">
                        <Sparkles size={16} aria-hidden="true" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/restaurante/${generarSlug(plato.restaurante_nombre)}?plato=${plato.id}`}
                      className={`block truncate text-[12.5px] font-extrabold text-hearth-espresso transition-colors hover:text-hearth-terracotta-ink dark:text-hearth-night-ink dark:hover:text-hearth-night-terracotta ${FOCO} rounded`}
                    >
                      {plato.nombre}
                    </Link>
                    <p className="truncate text-[10.5px] font-semibold text-hearth-pebble dark:text-hearth-night-pebble">
                      {plato.restaurante_nombre}
                    </p>
                    <p className="text-[11px] font-extrabold tabular-nums text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink">
                      {formatearPrecio(plato.precio)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onQuitar(plato)}
                    aria-label={`Quitar ${plato.nombre} de tus antojos`}
                    title="Quitar de la lista"
                    className={`af-pulsar flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-hearth-pebble transition-colors hover:bg-hearth-card hover:text-[#A3231C] dark:text-hearth-night-pebble dark:hover:bg-hearth-night-card dark:hover:text-[#FF9B91] ${FOCO}`}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-hearth-line/70 pt-3 dark:border-hearth-night-line/70">
            <Link
              to="/"
              className={`inline-flex items-center gap-1 text-[11px] font-bold text-hearth-terracotta-ink transition-colors hover:text-hearth-terracotta-deep dark:text-hearth-night-terracotta-ink dark:hover:text-hearth-night-terracotta ${FOCO} rounded`}
            >
              Seguir en el feed
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={onVaciar}
              className={`af-pulsar inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-hearth-pebble transition-colors hover:bg-hearth-oat hover:text-hearth-espresso dark:text-hearth-night-pebble dark:hover:bg-hearth-night-oat dark:hover:text-hearth-night-ink ${FOCO}`}
            >
              <Trash2 size={12} aria-hidden="true" />
              Vaciar
            </button>
          </div>
        </>
      )}
    </section>
  );
};
