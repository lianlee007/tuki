import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FOCO, TARJETA } from './estilos';

interface InspiracionProps {
  /** Platos cargados: con cero no hay nada que sortear. */
  cantidadPlatos: number;
  onSorprender: () => void;
}

const MUESTRAS = ['🍔', '🍣', '🥗'] as const;

/**
 * «No sé qué comer».
 *
 * Es el atajo para quien no quiere filtrar: abre la baraja de Inspiración, que
 * reparte platos reales uno a la vez y deja decidir con un gesto. La tarjeta se
 * viste como el resto de Descubrir —papel marfil, tinta espresso y terracota—
 * para que no parezca un anuncio pegado encima del feed.
 */
export const Inspiracion: React.FC<InspiracionProps> = ({
  cantidadPlatos,
  onSorprender,
}) => (
  <section
    aria-label="Inspiración al paso"
    className={`${TARJETA} relative overflow-hidden p-5`}
  >
    <div className="relative">
      <div className="flex items-center gap-2.5 border-b border-hearth-line/70 pb-3 dark:border-hearth-night-line">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-hearth-terracotta-soft text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink">
          <Sparkles size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-jakarta text-sm font-extrabold leading-snug text-hearth-espresso dark:text-hearth-night-ink">
            ¿No sabes qué comer hoy?
          </h2>
          <p className="truncate text-[11px] text-hearth-pebble dark:text-hearth-night-pebble">
            Una tarjeta a la vez
          </p>
        </div>
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
        Desliza a la derecha para guardar el plato en tus antojos y a la
        izquierda para dejarlo pasar. La cocina decide por ti.
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex items-center -space-x-2" aria-hidden="true">
            {MUESTRAS.map((emoji, indice) => (
              <span
                key={emoji}
                style={{ zIndex: MUESTRAS.length - indice }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-hearth-oat text-[13px] ring-2 ring-hearth-card dark:bg-hearth-night-oat dark:ring-hearth-night-card"
              >
                {emoji}
              </span>
            ))}
          </div>
          <span className="truncate text-[11px] font-bold tabular-nums text-hearth-pebble dark:text-hearth-night-pebble">
            {cantidadPlatos.toLocaleString('es-CO')} platos
          </span>
        </div>

        <button
          type="button"
          onClick={onSorprender}
          disabled={cantidadPlatos === 0}
          className={`af-pulsar inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-hearth-terracotta-deep px-3.5 py-2 text-[12px] font-extrabold text-white shadow-warm transition-colors hover:bg-hearth-terracotta-ink active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-hearth-night-terracotta dark:text-hearth-night dark:hover:bg-[#F6A184] ${FOCO}`}
        >
          Sorpréndeme
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>
);
