import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { DIETAS, RANGOS_PRECIO, type ClaveDieta, type ClavePrecio } from './filtros';
import { ETIQUETA, FOCO } from './estilos';

interface PanelFiltrosProps {
  abierto: boolean;
  total: number;
  precio: ClavePrecio | '';
  dietas: ClaveDieta[];
  onPrecio: (precio: ClavePrecio | '') => void;
  onDieta: (dieta: ClaveDieta) => void;
  onLimpiar: () => void;
  onCerrar: () => void;
}

const OPCIONES_PRECIO: { clave: ClavePrecio | ''; etiqueta: string }[] = [
  { clave: '', etiqueta: 'Cualquier precio' },
  ...Object.entries(RANGOS_PRECIO).map(([clave, rango]) => ({
    clave: clave as ClavePrecio,
    etiqueta: rango.etiqueta,
  })),
];

/**
 * Filtros en hoja.
 *
 * En móvil sube desde abajo (donde está el pulgar) y en escritorio se centra.
 * Se aplican al instante y el botón de cierre dice cuántos platos quedan, así
 * que no hay un «Aplicar» que prometa algo distinto de lo que ya se ve.
 */
export const PanelFiltros: React.FC<PanelFiltrosProps> = ({
  abierto,
  total,
  precio,
  dietas,
  onPrecio,
  onDieta,
  onLimpiar,
  onCerrar,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * El cierre vive en un ref para que el efecto dependa solo de `abierto`. Si
   * dependiera del `onCerrar` que llega por props (una función nueva en cada
   * render del padre), la hoja volvería a robar el foco cada vez que cambia el
   * recuento de platos — justo mientras el visitante está eligiendo filtros.
   */
  const cerrarRef = useRef(onCerrar);
  useEffect(() => {
    cerrarRef.current = onCerrar;
  });

  useEffect(() => {
    if (!abierto) return;

    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') cerrarRef.current();
    };

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', alPulsar);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener('keydown', alPulsar);
    };
  }, [abierto]);

  if (!abierto) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div
        className="af-entrada-velo absolute inset-0 bg-[#2B2421]/50 backdrop-blur-sm dark:bg-black/70"
        onClick={onCerrar}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-filtros"
        tabIndex={-1}
        className="af-hoja-entrada relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-hearth-cream p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-warm-xl outline-none sm:rounded-[28px] sm:p-6 dark:bg-hearth-night dark:shadow-warm-dark"
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-hearth-line sm:hidden dark:bg-hearth-night-line"
        />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`${ETIQUETA} text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink`}>
              Afina la búsqueda
            </p>
            <h2
              id="titulo-filtros"
              className="mt-1 font-jakarta text-xl font-extrabold tracking-[-0.02em] text-hearth-espresso dark:text-hearth-night-ink"
            >
              Filtros
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar los filtros"
            className={`af-pulsar flex h-9 w-9 items-center justify-center rounded-xl bg-hearth-oat text-hearth-pebble transition-colors hover:text-hearth-espresso dark:bg-hearth-night-oat dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink ${FOCO}`}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6">
          <p className={`${ETIQUETA} text-[10px] text-hearth-pebble dark:text-hearth-night-pebble`}>
            Precio por plato
          </p>
          <div className="mt-2 space-y-1.5">
            {OPCIONES_PRECIO.map((opcion) => {
              const activa = precio === opcion.clave;
              return (
                <button
                  key={opcion.clave || 'cualquiera'}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => onPrecio(opcion.clave)}
                  className={`af-pulsar flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-[14px] transition-colors ${FOCO} ${
                    activa
                      ? 'bg-hearth-terracotta-soft text-hearth-terracotta-ink ring-1 ring-hearth-terracotta/30 dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink dark:ring-white/10'
                      : 'text-hearth-espresso hover:bg-hearth-oat dark:text-hearth-night-ink dark:hover:bg-hearth-night-oat'
                  }`}
                >
                  <span className="font-semibold">{opcion.etiqueta}</span>
                  {activa && (
                    <Check
                      size={17}
                      aria-hidden="true"
                      className="text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <p className={`${ETIQUETA} text-[10px] text-hearth-pebble dark:text-hearth-night-pebble`}>
            Prefiero
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIETAS.map((dieta) => {
              const activa = dietas.includes(dieta.clave);
              return (
                <button
                  key={dieta.clave}
                  type="button"
                  onClick={() => onDieta(dieta.clave)}
                  aria-pressed={activa}
                  className={`af-pulsar rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${FOCO} ${
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

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-hearth-line/70 pt-4 dark:border-hearth-night-line">
          <button
            type="button"
            onClick={onLimpiar}
            className={`af-pulsar rounded-xl px-2 py-2 text-[13px] font-bold text-hearth-pebble transition-colors hover:text-hearth-espresso dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink ${FOCO}`}
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className={`af-pulsar rounded-xl bg-hearth-terracotta-deep px-5 py-3 text-[14px] font-extrabold text-white shadow-warm transition-colors hover:bg-hearth-terracotta-ink dark:bg-hearth-night-terracotta dark:text-hearth-night dark:hover:bg-[#F6A184] ${FOCO}`}
          >
            {total === 0
              ? 'Sin resultados'
              : total === 1
                ? 'Ver 1 plato'
                : `Ver ${total.toLocaleString('es-CO')} platos`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
