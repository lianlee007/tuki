import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTema } from '../../contexto/ContextoTema';

interface Props {
  /** Clases extra para el botón. */
  className?: string;
  /** Refuerza el raíl, para cuando vive sobre una barra con desenfoque. */
  conFondo?: boolean;
}

/**
 * Interruptor de tema: un raíl con el sol a la izquierda y la luna a la derecha.
 * Una bolita blanca se desliza hasta la mitad activa y el icono activo se
 * rellena con su color (cálido el sol, frío la luna) mientras el otro queda
 * apagado y algo más pequeño.
 *
 * La posición de la bolita y el relleno dicen lo mismo a la vez, así que el
 * estado no depende solo del color. Es `role="switch"`, de modo que un lector de
 * pantalla anuncia el estado («Modo oscuro, activado») igual de claro.
 */
export const ThemeToggle: React.FC<Props> = ({ className = '', conFondo = false }) => {
  const { tema, toggleTema } = useTema();
  const oscuro = tema === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={oscuro}
      aria-label="Modo oscuro"
      title={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      onClick={toggleTema}
      className={`af-tema ${conFondo ? 'af-tema--fondo' : ''} ${className}`}
    >
      <span className="af-tema__bola" aria-hidden="true" />
      <span className="af-tema__lado af-tema__sol" aria-hidden="true">
        <Sun size={14} strokeWidth={2.25} />
      </span>
      <span className="af-tema__lado af-tema__luna" aria-hidden="true">
        <Moon size={14} strokeWidth={2.25} />
      </span>
    </button>
  );
};
