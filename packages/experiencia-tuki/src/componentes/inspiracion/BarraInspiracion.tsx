import React from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { SimboloTuki, ThemeToggle } from '../ui';
import { FOCO } from '../descubrir/estilos';

interface BarraInspiracionProps {
  cantidadAntojos: number;
}

/**
 * Barra de la página de Inspiración.
 *
 * No repite el buscador del feed: aquí no se escribe, se desliza. En móvil se
 * queda en una fila fina —volver, título y acceso a guardados— para que la
 * baraja empiece cuanto antes. La marca grande solo aparece desde tablet, donde
 * sobra sitio.
 */
export const BarraInspiracion: React.FC<BarraInspiracionProps> = ({ cantidadAntojos }) => (
  <header className="sticky top-0 z-40 border-b border-hearth-line/60 bg-hearth-cream/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-hearth-night-line/80 dark:bg-hearth-night/95">
    <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3 lg:px-8">
      <Link
        to="/"
        aria-label="Volver al feed de descubrimiento"
        title="Volver al feed"
        className={`af-pulsar flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-hearth-oat text-hearth-espresso transition-colors hover:bg-hearth-oat-deep hover:text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:hover:bg-hearth-night-line dark:hover:text-hearth-night-terracotta ${FOCO}`}
      >
        <ArrowLeft size={19} aria-hidden="true" />
      </Link>

      <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-af-accent-solid text-white shadow-warm sm:flex">
        <SimboloTuki size={32} className="h-8 w-8" />
      </span>

      <div className="min-w-0 flex-1 leading-tight">
        <h1 className="truncate font-jakarta text-[17px] font-extrabold tracking-[-0.03em] text-hearth-espresso sm:text-lg dark:text-hearth-night-ink">
          Inspiración
        </h1>
        <p className="truncate text-[10.5px] font-semibold text-hearth-pebble dark:text-hearth-night-pebble">
          Desliza y decide
        </p>
      </div>

      <Link
        to="/?guardados=1"
        aria-label={
          cantidadAntojos > 0
            ? `Ver mis ${cantidadAntojos} platos guardados`
            : 'Ver mis platos guardados'
        }
        title="Ver mis guardados"
        className={`af-pulsar inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-hearth-terracotta-soft px-3 text-[11.5px] font-extrabold tabular-nums text-hearth-terracotta-ink transition-colors hover:bg-[#FBE2D9] dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink dark:hover:bg-[#4A2D24] ${FOCO}`}
      >
        <Heart size={13} aria-hidden="true" className="fill-current" />
        {cantidadAntojos}
      </Link>

      <ThemeToggle compacto />
    </div>
  </header>
);
