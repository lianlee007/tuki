import React from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, Undo2, X } from 'lucide-react';
import { FOCO } from '../descubrir/estilos';

interface ControlesBarajaProps {
  puedeDeshacer: boolean;
  hayActivo: boolean;
  /** Menú del restaurante del plato que está arriba. */
  destinoMenu: string | null;
  onDeshacer: () => void;
  onPasar: () => void;
  onAntojar: () => void;
}

/**
 * La zona del pulgar.
 *
 * Cuatro acciones y una jerarquía clara: el corazón terracota es la decisión
 * principal; pasar, deshacer y el menú quedan alrededor. Cada control conserva
 * su etiqueta para que el icono no cargue solo con el significado. Los cuatro
 * caben en una fila de teléfono sin apretar y dejan libre el borde inferior.
 */
export const ControlesBaraja: React.FC<ControlesBarajaProps> = ({
  puedeDeshacer,
  hayActivo,
  destinoMenu,
  onDeshacer,
  onPasar,
  onAntojar,
}) => {
  const base =
    'af-pulsar flex min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-2xl px-1 py-1 text-[10px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35';
  const circulo =
    'flex items-center justify-center rounded-full ring-1 transition-transform active:scale-95';

  return (
    <div
      className="mx-auto mt-3 flex w-full max-w-md items-end justify-between gap-1.5 px-1 sm:mt-4 sm:gap-3"
      aria-label="Controles de la baraja"
    >
      <button
        type="button"
        onClick={onDeshacer}
        disabled={!puedeDeshacer}
        title="Deshacer el último gesto"
        aria-label="Deshacer el último gesto"
        className={`${base} text-hearth-pebble hover:text-hearth-espresso dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink ${FOCO}`}
      >
        <span
          className={`${circulo} h-11 w-11 bg-hearth-oat ring-hearth-line/70 dark:bg-hearth-night-oat dark:ring-hearth-night-line`}
        >
          <Undo2 size={19} aria-hidden="true" />
        </span>
        Deshacer
      </button>

      <button
        type="button"
        onClick={onPasar}
        disabled={!hayActivo}
        title="Pasar este plato"
        aria-label="Pasar este plato"
        className={`${base} text-hearth-pebble hover:text-hearth-espresso dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink ${FOCO}`}
      >
        <span
          className={`${circulo} h-14 w-14 bg-hearth-oat-deep ring-hearth-line/70 shadow-warm dark:bg-hearth-night-oat dark:ring-hearth-night-line`}
        >
          <X size={24} aria-hidden="true" />
        </span>
        Pasar
      </button>

      <button
        type="button"
        onClick={onAntojar}
        disabled={!hayActivo}
        title="Me antoja: guardar en favoritos"
        aria-label="Me antoja: guardar en favoritos"
        className={`${base} text-hearth-terracotta-ink hover:text-hearth-terracotta-deep dark:text-hearth-night-terracotta-ink dark:hover:text-hearth-night-terracotta ${FOCO}`}
      >
        <span
          className={`${circulo} h-16 w-16 bg-hearth-terracotta-deep text-white ring-white/40 shadow-[0_12px_28px_rgba(158,60,34,0.32)] dark:bg-hearth-night-terracotta dark:text-hearth-night dark:ring-white/10`}
        >
          <Heart size={28} aria-hidden="true" className="fill-current" />
        </span>
        Me antoja
      </button>

      {destinoMenu ? (
        <Link
          to={destinoMenu}
          title="Ver el menú del restaurante"
          aria-label="Ver el menú del restaurante"
          className={`${base} text-hearth-pebble hover:text-hearth-terracotta-ink dark:text-hearth-night-pebble dark:hover:text-hearth-night-terracotta-ink ${FOCO}`}
        >
          <span
            className={`${circulo} h-11 w-11 bg-hearth-oat ring-hearth-line/70 dark:bg-hearth-night-oat dark:ring-hearth-night-line`}
          >
            <ArrowUpRight size={19} aria-hidden="true" />
          </span>
          Menú
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className={`${base} text-hearth-pebble opacity-40 dark:text-hearth-night-pebble`}
        >
          <span
            className={`${circulo} h-11 w-11 bg-hearth-oat ring-hearth-line/70 dark:bg-hearth-night-oat dark:ring-hearth-night-line`}
          >
            <ArrowUpRight size={19} />
          </span>
          Menú
        </span>
      )}
    </div>
  );
};
