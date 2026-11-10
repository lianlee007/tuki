import React, { useState } from 'react';
import { ChevronDown, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import type { TipoCocina } from '../../tipos/modelos';
import { iconoCocina } from './iconosCocina';
import { FOCO } from './estilos';

interface CarrilCocinasProps {
  cocinas: TipoCocina[];
  activa: string;
  onElegir: (slug: string) => void;
}

/** Cuántas cocinas se ven sin desplegar el panel. */
const LIMITE = 5;

/**
 * El filtro de cocinas.
 *
 * Una sola fila de pastillas que se recorre con el pulgar. La séptima cocina no
 * se esconde: el botón «Más» la anuncia y abre el resto en una cuadrícula. Si
 * la cocina activa vive entre las escondidas, sube a la fila para que el filtro
 * nunca mienta sobre lo que se está viendo.
 */
export const CarrilCocinas: React.FC<CarrilCocinasProps> = ({
  cocinas,
  activa,
  onElegir,
}) => {
  const [desplegado, setDesplegado] = useState(false);

  const base = `af-pulsar inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-colors ${FOCO}`;
  const activaClase =
    'bg-hearth-terracotta-deep text-white shadow-warm dark:bg-hearth-night-terracotta dark:text-hearth-night';
  const inactivaClase =
    'bg-hearth-card text-hearth-pebble ring-1 ring-hearth-line/70 hover:bg-hearth-terracotta-soft hover:text-hearth-terracotta-ink dark:bg-hearth-night-card dark:text-hearth-night-pebble dark:ring-hearth-night-line dark:hover:bg-hearth-night-terracotta-soft dark:hover:text-hearth-night-terracotta-ink';

  const activaObj = cocinas.find((cocina) => cocina.slug === activa);
  const primeras = cocinas.slice(0, LIMITE);
  const activaEscondida = Boolean(activaObj) && !primeras.some((c) => c.slug === activa);
  const visibles =
    activaEscondida && activaObj
      ? [activaObj, ...primeras.slice(0, LIMITE - 1)]
      : primeras;
  const resto = cocinas.filter(
    (cocina) => !visibles.some((visible) => visible.slug === cocina.slug)
  );

  const pintarCocina = (cocina: TipoCocina) => {
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
        <Icono size={14} aria-hidden="true" />
        {cocina.nombre}
      </button>
    );
  };

  return (
    <section aria-label="Filtrar por cocina" className="flex flex-col gap-2.5">
      <div className="relative">
        <nav
          aria-label="Tipos de cocina"
          className="af-sin-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-4 px-4 py-0.5 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:snap-none lg:flex-wrap lg:overflow-visible lg:px-0"
        >
          <button
            type="button"
            onClick={() => onElegir('')}
            aria-pressed={!activa}
            className={`${base} ${!activa ? activaClase : inactivaClase}`}
          >
            <LayoutGrid size={14} aria-hidden="true" />
            Todas
          </button>

          {visibles.map(pintarCocina)}

          {resto.length > 0 && (
            <button
              type="button"
              onClick={() => setDesplegado((previo) => !previo)}
              aria-expanded={desplegado}
              aria-controls="panel-mas-cocinas"
              className={`${base} ${inactivaClase}`}
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              {desplegado ? 'Menos' : `Más (${resto.length})`}
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={`transition-transform duration-200 ${desplegado ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </nav>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -right-4 w-8 bg-gradient-to-l from-hearth-cream to-transparent sm:-right-6 lg:hidden dark:from-hearth-night"
        />
      </div>

      {desplegado && resto.length > 0 && (
        <div
          id="panel-mas-cocinas"
          className="af-hoja-entrada grid grid-cols-2 gap-2 rounded-2xl bg-hearth-card/75 p-2.5 ring-1 ring-hearth-line/60 sm:grid-cols-3 sm:p-3 lg:grid-cols-4 dark:bg-hearth-night-card/75 dark:ring-hearth-night-line/80"
        >
          {resto.map((cocina) => {
            const Icono = iconoCocina(cocina.icono);
            const seleccionada = activa === cocina.slug;

            return (
              <button
                key={cocina.slug}
                type="button"
                onClick={() => {
                  onElegir(seleccionada ? '' : cocina.slug);
                  setDesplegado(false);
                }}
                aria-pressed={seleccionada}
                className={`af-pulsar flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12px] font-bold transition-colors ${FOCO} ${
                  seleccionada
                    ? 'bg-hearth-terracotta-deep text-white shadow-warm dark:bg-hearth-night-terracotta dark:text-hearth-night'
                    : 'bg-hearth-cream text-hearth-espresso ring-1 ring-hearth-line/60 hover:bg-hearth-terracotta-soft hover:text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:ring-hearth-night-line dark:hover:bg-hearth-night-terracotta-soft dark:hover:text-hearth-night-terracotta-ink'
                }`}
              >
                <Icono size={14} aria-hidden="true" className="shrink-0" />
                <span className="truncate">{cocina.nombre}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
