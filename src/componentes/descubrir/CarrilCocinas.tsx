import React from 'react';
import type { TipoCocina } from '../../tipos/modelos';
import { iconoCocina } from './iconosCocina';

interface CarrilCocinasProps {
  cocinas: TipoCocina[];
  activa: string;
  onElegir: (slug: string) => void;
}

/**
 * Carril horizontal de cocinas. Es navegación, no decoración: el icono va
 * dentro de la pastilla (nunca encima de una tarjeta) y la activa se marca con
 * tinta llena para que se lea de un vistazo en claro y en oscuro.
 */
export const CarrilCocinas: React.FC<CarrilCocinasProps> = ({ cocinas, activa, onElegir }) => (
  <nav aria-label="Tipos de cocina" className="af-sin-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1">
    <button
      type="button"
      onClick={() => onElegir('')}
      aria-pressed={!activa}
      className={`af-pulsar flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
        !activa ? 'bg-af-ink text-af-ground' : 'bg-af-surface text-af-ink-secondary hover:text-af-ink'
      }`}
    >
      Todas
    </button>

    {cocinas.map((cocina) => {
      const Icono = iconoCocina(cocina.icono);
      const seleccionada = activa === cocina.slug;
      return (
        <button
          key={cocina.slug}
          type="button"
          onClick={() => onElegir(seleccionada ? '' : cocina.slug)}
          aria-pressed={seleccionada}
          className={`af-pulsar flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
            seleccionada
              ? 'bg-af-ink text-af-ground'
              : 'bg-af-surface text-af-ink-secondary hover:text-af-ink'
          }`}
        >
          <Icono size={15} aria-hidden="true" />
          {cocina.nombre}
        </button>
      );
    })}
  </nav>
);
