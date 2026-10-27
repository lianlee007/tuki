import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface HojaProps {
  abierto: boolean;
  onCerrar: () => void;
  tituloId: string;
  ancho?: 'sm' | 'lg';
  children: React.ReactNode;
}

/**
 * La hoja de Descubrir: sube desde abajo en móvil y se centra en escritorio.
 *
 * El cierre vive en un ref para que el efecto dependa solo de `abierto` y no
 * vuelva a robar el foco cada vez que el padre se re-renderiza (por ejemplo,
 * al cambiar la cantidad de un plato en el carrito).
 */
export const Hoja: React.FC<HojaProps> = ({ abierto, onCerrar, tituloId, ancho = 'sm', children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
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
    <div className="fixed inset-0 z-[65] flex items-end justify-center sm:items-center">
      <div
        className="af-entrada-velo absolute inset-0 bg-black/40"
        onClick={onCerrar}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className={`af-hoja-entrada relative max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] bg-af-ground p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] outline-none sm:rounded-[28px] sm:p-6 ${
          ancho === 'lg' ? 'sm:max-w-lg' : 'sm:max-w-md'
        }`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
