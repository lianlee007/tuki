import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTema } from '../../contexto/ContextoTema';

interface Props {
  /** Clases extra para el botón. */
  className?: string;
  /** Refuerza el raíl, para cuando vive sobre una barra con desenfoque. */
  conFondo?: boolean;
  /** En barras estrechas: un botón de 40 px en vez del raíl de 56 px. */
  compacto?: boolean;
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
export const ThemeToggle: React.FC<Props> = ({
  className = '',
  conFondo = false,
  compacto = false,
}) => {
  const { tema, toggleTema } = useTema();
  const oscuro = tema === 'dark';
  const etiqueta = oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  if (compacto) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={oscuro}
        aria-label={etiqueta}
        title={etiqueta}
        onClick={toggleTema}
        className={`af-pulsar flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-hearth-oat text-hearth-espresso transition-colors hover:text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:hover:text-hearth-night-terracotta ${className}`}
      >
        {oscuro ? (
          <Sun size={18} strokeWidth={2.1} aria-hidden="true" />
        ) : (
          <Moon size={18} strokeWidth={2.1} aria-hidden="true" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={oscuro}
      aria-label={etiqueta}
      title={etiqueta}
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
