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
 * El asa visible solo aparece en móvil —donde invita a arrastrar hacia abajo— y
 * no en escritorio, donde el diálogo se cierra con la X o con Escape. El cierre
 * vive en un ref para que el efecto dependa solo de `abierto` y no vuelva a
 * robar el foco cada vez que el padre se re-renderiza (por ejemplo, al cambiar
 * la cantidad de un plato en el carrito).
 */
export const Hoja: React.FC<HojaProps> = ({ abierto, onCerrar, tituloId, ancho = 'sm', children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const cerrarRef = useRef(onCerrar);

  useEffect(() => {
    cerrarRef.current = onCerrar;
  });

  useEffect(() => {
    if (!abierto) return;

    const disparador = document.activeElement as HTMLElement | null;

    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        cerrarRef.current();
        return;
      }
      if (evento.key !== 'Tab' || !panelRef.current) return;

      // El foco no debe escaparse al fondo: la hoja se comporta como un diálogo.
      const focos = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((elemento) => elemento.offsetParent !== null);

      if (focos.length === 0) {
        evento.preventDefault();
        panelRef.current.focus();
        return;
      }

      const primero = focos[0];
      const ultimo = focos[focos.length - 1];
      const activo = document.activeElement;

      if (!evento.shiftKey && activo === ultimo) {
        evento.preventDefault();
        primero.focus();
      } else if (evento.shiftKey && (activo === primero || activo === panelRef.current)) {
        evento.preventDefault();
        ultimo.focus();
      }
    };

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', alPulsar);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener('keydown', alPulsar);
      disparador?.focus?.();
    };
  }, [abierto]);

  if (!abierto) return null;

  return createPortal(
    <div className="fixed inset-0 z-[65] flex items-end justify-center sm:items-center">
      <div
        className="af-entrada-velo absolute inset-0 bg-[#2B2421]/50 backdrop-blur-sm dark:bg-black/70"
        onClick={onCerrar}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className={`af-hoja-entrada relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[28px] bg-hearth-cream p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] outline-none shadow-warm-xl sm:rounded-[28px] sm:p-6 dark:bg-hearth-night dark:shadow-warm-dark ${
          ancho === 'lg' ? 'sm:max-w-lg' : 'sm:max-w-md'
        }`}
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-hearth-line sm:hidden dark:bg-hearth-night-line"
        />
        {children}
      </div>
    </div>,
    document.body
  );
};
