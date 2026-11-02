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
 * principal; pasar y deshacer quedan alrededor, más pequeños. En escritorio
 * cada control conserva una etiqueta corta para que el icono no cargue solo con
 * el significado. El enlace al menú es el único que sale de la baraja.
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
    'af-pulsar flex flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-[9.5px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div
      className="mt-4 flex items-start justify-center gap-2 sm:gap-4"
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
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-hearth-oat ring-1 ring-hearth-line/70 dark:bg-hearth-night-oat dark:ring-hearth-night-line">
          <Undo2 size={20} aria-hidden="true" />
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
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-hearth-oat-deep shadow-warm ring-1 ring-hearth-line/70 dark:bg-hearth-night-oat dark:ring-hearth-night-line">
          <X size={26} aria-hidden="true" />
        </span>
        Pasar
      </button>

      <button
        type="button"
        onClick={onAntojar}
        disabled={!hayActivo}
        title="¡Me antoja! Guardar en favoritos"
        aria-label="¡Me antoja! Guardar en favoritos"
        className={`${base} text-hearth-terracotta-ink hover:text-hearth-terracotta-deep dark:text-hearth-night-terracotta-ink dark:hover:text-hearth-night-terracotta ${FOCO}`}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-hearth-terracotta-deep text-white shadow-[0_12px_28px_rgba(158,60,34,0.32)] transition-transform hover:bg-hearth-terracotta-ink dark:bg-hearth-night-terracotta dark:text-hearth-night dark:hover:bg-[#F6A184]">
          <Heart size={30} aria-hidden="true" className="fill-current" />
        </span>
        ¡Me antoja!
      </button>

      {destinoMenu ? (
        <Link
          to={destinoMenu}
          title="Ver el menú del restaurante"
          aria-label="Ver el menú del restaurante"
          className={`${base} text-hearth-pebble hover:text-hearth-terracotta-ink dark:text-hearth-night-pebble dark:hover:text-hearth-night-terracotta-ink ${FOCO}`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-hearth-oat ring-1 ring-hearth-line/70 dark:bg-hearth-night-oat dark:ring-hearth-night-line">
            <ArrowUpRight size={20} aria-hidden="true" />
          </span>
          Ver menú
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className={`${base} text-hearth-pebble opacity-40 dark:text-hearth-night-pebble`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-hearth-oat ring-1 ring-hearth-line/70 dark:bg-hearth-night-oat dark:ring-hearth-night-line">
            <ArrowUpRight size={20} />
          </span>
          Ver menú
        </span>
      )}
    </div>
  );
};
