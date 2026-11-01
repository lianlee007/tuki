import React from 'react';
import { LayoutGrid } from 'lucide-react';
import type { TipoCocina } from '../../tipos/modelos';
import { iconoCocina } from './iconosCocina';
import { FOCO } from './estilos';

interface CarrilCocinasProps {
  cocinas: TipoCocina[];
  activa: string;
  onElegir: (slug: string) => void;
}

/**
 * Carril horizontal de cocinas.
 *
 * Es navegación, no decoración: el icono va dentro de la pastilla y la activa
 * se marca con terracota sólida, así el estado se lee de un vistazo en claro y
 * en oscuro. En móvil se recorre con el pulgar y las pastillas que sobran
 * asoman por el borde para invitar a deslizar.
 */
export const CarrilCocinas: React.FC<CarrilCocinasProps> = ({
  cocinas,
  activa,
  onElegir,
}) => {
  const base = `af-pulsar inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition-colors ${FOCO}`;
  const activaClase =
    'bg-hearth-terracotta-deep text-white shadow-warm dark:bg-hearth-night-terracotta dark:text-hearth-night';
  const inactivaClase =
    'bg-hearth-card text-hearth-pebble ring-1 ring-hearth-line/70 hover:bg-hearth-terracotta-soft hover:text-hearth-terracotta-ink dark:bg-hearth-night-card dark:text-hearth-night-pebble dark:ring-hearth-night-line dark:hover:bg-hearth-night-terracotta-soft dark:hover:text-hearth-night-terracotta-ink';

  return (
    <nav
      aria-label="Tipos de cocina"
      className="af-sin-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0"
    >
      <button
        type="button"
        onClick={() => onElegir('')}
        aria-pressed={!activa}
        className={`${base} ${!activa ? activaClase : inactivaClase}`}
      >
        <LayoutGrid size={15} aria-hidden="true" />
        Todas
      </button>

      {cocinas.map((cocina) => {
        const Icono = iconoCocina(cocina.icono);
        const seleccionada = activa === cocina.slug;

        return (
          <button
            key={cocina.slug}
            type="button"
            onClick={() => onElegir(seleccionada ? '' : cocina.slug)}
            aria-pressed={seleccionada}
            className={`${base} ${seleccionada ? activaClase : inactivaClase}`}
          >
            <Icono size={15} aria-hidden="true" />
            {cocina.nombre}
          </button>
        );
      })}
    </nav>
  );
};
