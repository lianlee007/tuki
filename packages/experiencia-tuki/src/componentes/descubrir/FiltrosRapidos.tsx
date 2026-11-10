import React from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import {
  DIETAS,
  RANGOS_PRECIO,
  type ClaveDieta,
  type ClavePrecio,
} from './filtros';
import { ETIQUETA, FOCO, TARJETA } from './estilos';

interface FiltrosRapidosProps {
  precio: ClavePrecio | '';
  dietas: ClaveDieta[];
  onPrecio: (precio: ClavePrecio | '') => void;
  onDieta: (dieta: ClaveDieta) => void;
  onLimpiar: () => void;
}

const OPCIONES_PRECIO: { clave: ClavePrecio | ''; etiqueta: string }[] = [
  { clave: '', etiqueta: 'Todos' },
  ...Object.entries(RANGOS_PRECIO).map(([clave, rango]) => ({
    clave: clave as ClavePrecio,
    etiqueta: rango.etiqueta,
  })),
];

/**
 * Los filtros rápidos de la columna lateral.
 *
 * Repiten los mismos controles que la hoja de móvil para que el escritorio no
 * obligue a abrir un diálogo por un filtro de precio. Se aplican al instante:
 * no hay botón «Aplicar» que prometa algo distinto de lo que ya se ve.
 */
export const FiltrosRapidos: React.FC<FiltrosRapidosProps> = ({
  precio,
  dietas,
  onPrecio,
  onDieta,
  onLimpiar,
}) => {
  const activos = (precio ? 1 : 0) + dietas.length;

  return (
    <section aria-labelledby="titulo-filtros-rapidos" className={`${TARJETA} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-hearth-terracotta-soft text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink">
            <SlidersHorizontal size={16} aria-hidden="true" />
          </span>
          <h2
            id="titulo-filtros-rapidos"
            className="font-jakarta text-sm font-extrabold text-hearth-espresso dark:text-hearth-night-ink"
          >
            Filtros rápidos
          </h2>
        </div>

        <button
          type="button"
          onClick={onLimpiar}
          disabled={activos === 0}
          className={`af-pulsar inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-hearth-terracotta-ink transition-colors hover:bg-hearth-terracotta-soft disabled:cursor-not-allowed disabled:opacity-40 dark:text-hearth-night-terracotta-ink dark:hover:bg-hearth-night-terracotta-soft ${FOCO}`}
        >
          <RotateCcw size={12} aria-hidden="true" />
          Reiniciar
        </button>
      </div>

      <div className="mt-4">
        <p className={`${ETIQUETA} text-[9px] text-hearth-pebble dark:text-hearth-night-pebble`}>
          Rango de precio
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {OPCIONES_PRECIO.map((opcion) => {
            const activa = precio === opcion.clave;
            return (
              <button
                key={opcion.clave || 'todos'}
                type="button"
                aria-pressed={activa}
                onClick={() => onPrecio(activa ? '' : opcion.clave)}
                className={`af-pulsar rounded-xl px-2.5 py-2 text-[11px] font-bold transition-colors ${FOCO} ${
                  activa
                    ? 'bg-hearth-terracotta-deep text-white shadow-warm dark:bg-hearth-night-terracotta dark:text-hearth-night'
                    : 'bg-hearth-oat text-hearth-pebble hover:text-hearth-espresso dark:bg-hearth-night-oat dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink'
                }`}
              >
                {opcion.etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <p className={`${ETIQUETA} text-[9px] text-hearth-pebble dark:text-hearth-night-pebble`}>
          Preferencias
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DIETAS.map((dieta) => {
            const activa = dietas.includes(dieta.clave);
            return (
              <button
                key={dieta.clave}
                type="button"
                aria-pressed={activa}
                onClick={() => onDieta(dieta.clave)}
                className={`af-pulsar rounded-full px-3 py-1.5 text-[11.5px] font-bold transition-colors ${FOCO} ${
                  activa
                    ? 'bg-hearth-sage text-white shadow-warm dark:bg-hearth-night-sage-ink dark:text-hearth-night'
                    : 'bg-hearth-sage-soft text-hearth-sage-ink hover:bg-[#E1EDE2] dark:bg-hearth-night-sage-soft dark:text-hearth-night-sage-ink dark:hover:bg-[#253C2A]'
                }`}
              >
                {dieta.etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-hearth-oat/70 p-3 text-[10.5px] leading-relaxed text-hearth-pebble ring-1 ring-hearth-line/60 dark:bg-hearth-night-oat/70 dark:text-hearth-night-pebble dark:ring-hearth-night-line/60">
        Los precios son los de la carta de cada restaurante. TukiTuki no aplica
        recargos ni comisiones al comensal.
      </p>
    </section>
  );
};
