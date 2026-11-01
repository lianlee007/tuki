import React, { useState } from 'react';
import { ArrowRight, ChevronDown, LayoutGrid, SlidersHorizontal, Store } from 'lucide-react';
import type { TipoCocina } from '../../tipos/modelos';
import { iconoCocina } from './iconosCocina';
import { ETIQUETA, FOCO } from './estilos';

interface CarrilCocinasProps {
  cocinas: TipoCocina[];
  activa: string;
  onElegir: (slug: string) => void;
  /** Cifras del catálogo para el resumen de la cabecera. */
  totalPlatos: number;
  totalRestaurantes: number;
  /** Atajo a la sección de restaurantes, que vive después del feed. */
  onVerRestaurantes?: () => void;
}

/** Cuántas cocinas se ven sin desplegar el panel. */
const LIMITE = 6;

/**
 * El filtro de cocinas de la portada.
 *
 * Arriba solo viven las primeras cocinas: la fila se recorre con el pulgar en
 * móvil y se envuelve en escritorio. El resto espera en un panel desplegable,
 * para que el catálogo no empiece con cinco filas de pastillas. Si la cocina
 * activa está entre las escondidas, se sube a la fila para que el filtro nunca
 * mienta sobre lo que se está viendo.
 */
export const CarrilCocinas: React.FC<CarrilCocinasProps> = ({
  cocinas,
  activa,
  onElegir,
  totalPlatos,
  totalRestaurantes,
  onVerRestaurantes,
}) => {
  const [desplegado, setDesplegado] = useState(false);

  const base = `af-pulsar inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition-colors ${FOCO}`;
  const activaClase =
    'bg-hearth-terracotta-deep text-white shadow-warm dark:bg-hearth-night-terracotta dark:text-hearth-night';
  const inactivaClase =
    'bg-hearth-card text-hearth-pebble ring-1 ring-hearth-line/70 hover:bg-hearth-terracotta-soft hover:text-hearth-terracotta-ink dark:bg-hearth-night-card dark:text-hearth-night-pebble dark:ring-hearth-night-line dark:hover:bg-hearth-night-terracotta-soft dark:hover:text-hearth-night-terracotta-ink';

  const activaObj = cocinas.find((cocina) => cocina.slug === activa);
  const primeras = cocinas.slice(0, LIMITE);
  const activaEscondida = Boolean(activaObj) && !primeras.some((c) => c.slug === activa);
  const visibles = activaEscondida && activaObj
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
        <Icono size={15} aria-hidden="true" />
        {cocina.nombre}
      </button>
    );
  };

  return (
    <section aria-labelledby="titulo-cocinas" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className={`${ETIQUETA} text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink`}>
            Filtra por antojo
          </p>
          <h1
            id="titulo-cocinas"
            className="mt-1 font-jakarta text-[clamp(1.55rem,3.4vw,2rem)] font-extrabold leading-tight tracking-[-0.03em] text-hearth-espresso dark:text-hearth-night-ink"
          >
            ¿Qué se te antoja hoy?
          </h1>
          <p className="mt-1 text-[12.5px] text-hearth-pebble dark:text-hearth-night-pebble">
            {totalPlatos.toLocaleString('es-CO')} platos de{' '}
            {totalRestaurantes.toLocaleString('es-CO')} locales ·{' '}
            {cocinas.length.toLocaleString('es-CO')} cocinas
          </p>
        </div>

        {resto.length > 0 && (
          <button
            type="button"
            onClick={() => setDesplegado((previo) => !previo)}
            aria-expanded={desplegado}
            aria-controls="panel-mas-cocinas"
            className={`af-pulsar ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-hearth-card px-3.5 py-2.5 text-[12.5px] font-bold text-hearth-espresso ring-1 ring-hearth-line/70 transition-colors hover:bg-hearth-terracotta-soft hover:text-hearth-terracotta-ink dark:bg-hearth-night-card dark:text-hearth-night-ink dark:ring-hearth-night-line dark:hover:bg-hearth-night-terracotta-soft dark:hover:text-hearth-night-terracotta-ink ${FOCO}`}
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            {desplegado ? 'Ver menos' : `Ver todas (${resto.length + visibles.length})`}
            <ChevronDown
              size={15}
              aria-hidden="true"
              className={`transition-transform duration-200 ${desplegado ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      <nav
        aria-label="Tipos de cocina"
        className="af-sin-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0 lg:overflow-visible"
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

        {visibles.map(pintarCocina)}
      </nav>

      {desplegado && resto.length > 0 && (
        <div
          id="panel-mas-cocinas"
          className="rounded-2xl bg-hearth-card/75 p-3 ring-1 ring-hearth-line/60 sm:p-4 dark:bg-hearth-night-card/75 dark:ring-hearth-night-line/80"
        >
          <p className={`${ETIQUETA} text-[9px] text-hearth-pebble dark:text-hearth-night-pebble`}>
            Más cocinas
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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
                  className={`af-pulsar flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-bold transition-colors ${FOCO} ${
                    seleccionada
                      ? 'bg-hearth-terracotta-deep text-white shadow-warm dark:bg-hearth-night-terracotta dark:text-hearth-night'
                      : 'bg-hearth-cream text-hearth-espresso ring-1 ring-hearth-line/60 hover:bg-hearth-terracotta-soft hover:text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:ring-hearth-night-line dark:hover:bg-hearth-night-terracotta-soft dark:hover:text-hearth-night-terracotta-ink'
                  }`}
                >
                  <Icono size={15} aria-hidden="true" className="shrink-0" />
                  <span className="truncate">{cocina.nombre}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {onVerRestaurantes && totalRestaurantes > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onVerRestaurantes}
            className={`af-pulsar inline-flex items-center gap-1.5 rounded-lg text-[12px] font-bold text-hearth-terracotta-ink transition-colors hover:text-hearth-terracotta-deep dark:text-hearth-night-terracotta-ink dark:hover:text-hearth-night-terracotta ${FOCO}`}
          >
            <Store size={14} aria-hidden="true" />
            {totalRestaurantes === 1
              ? 'Ver el restaurante'
              : `Ver los ${totalRestaurantes} restaurantes`}
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
};
