import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { DIETAS, RANGOS_PRECIO, type ClaveDieta, type ClavePrecio } from './filtros';

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
        className="af-entrada-velo absolute inset-0 bg-black/40"
        onClick={onCerrar}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-filtros"
        tabIndex={-1}
        className="af-hoja-entrada relative w-full max-w-lg rounded-t-[28px] bg-af-ground p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] outline-none sm:rounded-[28px] sm:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="titulo-filtros" className="text-[20px] font-semibold tracking-tight text-af-ink">
            Filtros
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar los filtros"
            className="af-pulsar rounded-full bg-af-surface p-2 text-af-ink-secondary transition-colors hover:text-af-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6">
          <p className="text-[13px] font-semibold text-af-ink-secondary">Precio</p>
          <div className="mt-2 space-y-1">
            {OPCIONES_PRECIO.map((opcion) => {
              const activa = precio === opcion.clave;
              return (
                <button
                  key={opcion.clave || 'cualquiera'}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => onPrecio(opcion.clave)}
                  className="af-pulsar flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-left text-[15px] transition-colors hover:bg-af-surface"
                >
                  <span className={activa ? 'font-semibold text-af-ink' : 'text-af-ink'}>
                    {opcion.etiqueta}
                  </span>
                  {activa && <Check size={17} aria-hidden="true" className="text-af-accent-text" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[13px] font-semibold text-af-ink-secondary">Prefiero</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIETAS.map((dieta) => {
              const activa = dietas.includes(dieta.clave);
              return (
                <button
                  key={dieta.clave}
                  type="button"
                  onClick={() => onDieta(dieta.clave)}
                  aria-pressed={activa}
                  className={`af-pulsar rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
                    activa
                      ? 'bg-af-ink text-af-ground'
                      : 'bg-af-surface text-af-ink-secondary hover:text-af-ink'
                  }`}
                >
                  {dieta.etiqueta}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onLimpiar}
            className="af-pulsar rounded-full px-2 py-2 text-[14px] font-semibold text-af-ink-secondary transition-colors hover:text-af-ink"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="af-pulsar rounded-full bg-af-ink px-6 py-3 text-[15px] font-semibold text-af-ground transition-opacity hover:opacity-90"
          >
            {total === 0
              ? 'Sin resultados'
              : total === 1
                ? 'Ver 1 plato'
                : `Ver ${total} platos`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
