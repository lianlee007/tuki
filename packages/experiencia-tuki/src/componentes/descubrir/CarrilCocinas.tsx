import React, { useState } from 'react';
import { ChevronDown, LayoutGrid, SlidersHorizontal } from 'lucide-react';
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
}) => {
  const [desplegado, setDesplegado] = useState(false);

  const base = `af-pulsar inline-flex shrink-0 snap-start items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition-colors ${FOCO}`;
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

  const totalCocinas = resto.length + visibles.length;

  /**
   * El botón que abre el resto del catálogo. En escritorio vive junto al
   * título; en móvil se queda debajo del carril, a ancho completo, para que no
   * flote solo a la derecha dejando un hueco muerto.
   */
  const botonMas = (ancho: boolean) => (
    <button
      type="button"
      onClick={() => setDesplegado((previo) => !previo)}
      aria-expanded={desplegado}
      aria-controls="panel-mas-cocinas"
      className={`af-pulsar items-center gap-1.5 rounded-xl text-[12.5px] font-bold transition-colors ${FOCO} ${
        ancho
          ? 'inline-flex justify-center bg-transparent px-3 py-2 text-hearth-terracotta-ink hover:bg-hearth-terracotta-soft dark:text-hearth-night-terracotta-ink dark:hover:bg-hearth-night-terracotta-soft'
          : 'inline-flex shrink-0 bg-hearth-card px-3.5 py-2.5 text-hearth-espresso ring-1 ring-hearth-line/70 hover:bg-hearth-terracotta-soft hover:text-hearth-terracotta-ink dark:bg-hearth-night-card dark:text-hearth-night-ink dark:ring-hearth-night-line dark:hover:bg-hearth-night-terracotta-soft dark:hover:text-hearth-night-terracotta-ink'
      }`}
    >
      <SlidersHorizontal size={15} aria-hidden="true" />
      {desplegado
        ? 'Ver menos'
        : ancho
          ? `Ver todas las cocinas (${totalCocinas})`
          : `Ver todas (${totalCocinas})`}
      <ChevronDown
        size={15}
        aria-hidden="true"
        className={`transition-transform duration-200 ${desplegado ? 'rotate-180' : ''}`}
      />
    </button>
  );

  return (
    <section aria-labelledby="titulo-cocinas" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h1
            id="titulo-cocinas"
            className="text-balance font-jakarta text-[clamp(1.6rem,3.4vw,2rem)] font-extrabold leading-tight tracking-[-0.03em] text-hearth-espresso dark:text-hearth-night-ink"
          >
            ¿Qué se te antoja hoy?
          </h1>
          <p className="mt-1 text-[12.5px] text-hearth-pebble dark:text-hearth-night-pebble">
            {totalPlatos.toLocaleString('es-CO')} platos en{' '}
            {totalRestaurantes.toLocaleString('es-CO')} restaurantes
          </p>
        </div>

        {resto.length > 0 && <div className="hidden sm:block">{botonMas(false)}</div>}
      </div>

      <div className="relative">
        <nav
          aria-label="Tipos de cocina"
          className="af-sin-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-4 px-4 py-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:snap-none lg:flex-wrap lg:overflow-visible lg:px-0"
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

        {/* El velo del borde derecho insinúa que hay más cocinas sin cortar una
            pastilla a mitad: en móvil el carril se recorre con el pulgar. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -right-4 w-8 bg-gradient-to-l from-hearth-cream to-transparent sm:-right-6 lg:hidden dark:from-hearth-night"
        />
      </div>

      {resto.length > 0 && <div className="flex justify-center sm:hidden">{botonMas(true)}</div>}

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
    </section>
  );
};
