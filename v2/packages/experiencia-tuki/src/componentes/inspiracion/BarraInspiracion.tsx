import React from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Sparkles } from 'lucide-react';
import { SimboloTuki, ThemeToggle } from '../ui';
import { FOCO } from '../descubrir/estilos';

interface BarraInspiracionProps {
  cantidadAntojos: number;
}

/**
 * Barra de la página de Inspiración.
 *
 * No repite el buscador del feed: aquí no se escribe, se desliza. La flecha es
 * la salida clara, la marca recuerda de dónde vienes y el contador de antojos
 * acompaña sin convertirse en otro botón.
 */
export const BarraInspiracion: React.FC<BarraInspiracionProps> = ({ cantidadAntojos }) => (
  <header className="sticky top-0 z-40 border-b border-hearth-line/70 bg-hearth-cream/90 backdrop-blur-xl dark:border-hearth-night-line/80 dark:bg-hearth-night/90">
    <div className="mx-auto flex w-full max-w-7xl items-center gap-2.5 px-4 py-3 sm:gap-3 sm:px-6 lg:px-8">
      <Link
        to="/"
        aria-label="Volver al feed de descubrimiento"
        title="Volver al feed"
        className={`af-pulsar flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hearth-oat text-hearth-espresso transition-colors hover:bg-hearth-oat-deep hover:text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:hover:bg-hearth-night-line dark:hover:text-hearth-night-terracotta ${FOCO}`}
      >
        <ArrowLeft size={18} aria-hidden="true" />
      </Link>

      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-af-accent-solid text-white shadow-warm sm:h-12 sm:w-12">
          <SimboloTuki size={30} />
        </span>
        <div className="min-w-0 leading-tight">
          <h1 className="truncate font-jakarta text-lg font-extrabold tracking-[-0.03em] text-hearth-espresso dark:text-hearth-night-ink">
            Inspiración
          </h1>
          <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.16em] text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink">
            Desliza y decide
          </p>
        </div>
      </div>

      <span className="ml-2 hidden items-center gap-1.5 rounded-full bg-hearth-honey-soft px-3 py-1.5 text-[10.5px] font-bold text-hearth-honey-ink sm:inline-flex dark:bg-[#3A2A12] dark:text-[#F5C27A]">
        <Sparkles size={12} aria-hidden="true" />
        Una tarjeta a la vez
      </span>

      <div className="ml-auto flex items-center gap-2">
        <span
          aria-live="polite"
          className="inline-flex items-center gap-1.5 rounded-full bg-hearth-terracotta-soft px-3 py-1.5 text-[11px] font-extrabold tabular-nums text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink"
        >
          <Heart size={12} aria-hidden="true" className="fill-current" />
          <span className="hidden sm:inline">Antojos</span>
          {cantidadAntojos}
        </span>
        <ThemeToggle conFondo />
      </div>
    </div>
  </header>
);
