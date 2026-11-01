import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FOCO } from './estilos';

interface InspiracionProps {
  /** Platos cargados: con cero no hay nada que sortear. */
  cantidadPlatos: number;
  onSorprender: () => void;
}

const MUESTRAS = ['🍔', '🍣', '🥗'] as const;

/**
 * «No sé qué comer».
 *
 * Es el atajo para quien no quiere filtrar: el botón elige un plato del feed
 * —real, ya cargado— y abre su ficha. No promete un catálogo distinto ni
 * inventa recomendaciones que la base no pueda sostener.
 */
export const Inspiracion: React.FC<InspiracionProps> = ({
  cantidadPlatos,
  onSorprender,
}) => (
  <section
    aria-labelledby="titulo-inspiracion"
    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-hearth-terracotta via-[#E06D44] to-hearth-terracotta-deep p-6 text-white shadow-warm-lg dark:from-[#8A3E2B] dark:via-[#6E3021] dark:to-[#4A241A] dark:shadow-warm-dark"
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/15 blur-2xl"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-8 -top-12 h-32 w-32 rounded-full bg-hearth-honey/20 blur-2xl"
    />

    <div className="relative z-10 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] ring-1 ring-white/25 backdrop-blur-md">
          Inspiración al paso
        </span>
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
        <Sparkles size={20} aria-hidden="true" />
      </span>
    </div>

    <h2
      id="titulo-inspiracion"
      className="relative z-10 mt-4 font-jakarta text-xl font-extrabold leading-snug tracking-[-0.02em]"
    >
      ¿No sabes qué almorzar hoy?
    </h2>
    <p className="relative z-10 mt-1.5 text-[12.5px] font-medium leading-relaxed text-white/90">
      Deja que la cocina decida por ti. Elegimos un plato del feed y te lo
      mostramos con todo lo que necesitas para pedirlo.
    </p>

    <div className="relative z-10 mt-5 flex items-center justify-between gap-3">
      <div className="flex items-center -space-x-2">
        {MUESTRAS.map((emoji) => (
          <span
            key={emoji}
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[14px] shadow-md ring-2 ring-white/60"
          >
            {emoji}
          </span>
        ))}
        <span className="pl-3.5 text-[11px] font-extrabold">
          {cantidadPlatos.toLocaleString('es-CO')} platos
        </span>
      </div>

      <button
        type="button"
        onClick={onSorprender}
        disabled={cantidadPlatos === 0}
        className={`af-pulsar inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-[12px] font-extrabold text-hearth-terracotta-ink shadow-warm transition-colors hover:bg-hearth-cream disabled:cursor-not-allowed disabled:opacity-60 dark:bg-hearth-night-ink dark:text-hearth-night ${FOCO}`}
      >
        Sorpréndeme
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </div>
  </section>
);
