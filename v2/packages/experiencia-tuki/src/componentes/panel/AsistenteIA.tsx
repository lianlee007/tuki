import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { RobotIA } from '../sistema-diseno/RobotIA';
import { Boton } from '../ui';

/**
 * Botón pequeño de IA junto a un campo.
 *
 * Misma forma, mismo tamaño y mismo color en todo el producto: el icono lleva
 * el acento y el texto la tinta legible, sobre una pastilla que solo se tiñe al
 * pasar el ratón. Así la ayuda de IA no compite con el contenido del formulario
 * ni cambia de aspecto de una sección a otra.
 */
export const BotonIA: React.FC<{
  onClick: () => void;
  cargando?: boolean;
  disabled?: boolean;
  icono: React.ReactNode;
  children: React.ReactNode;
}> = ({ onClick, cargando, disabled, icono, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || cargando}
    className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-af-accent-text transition-colors duration-150 outline-none hover:bg-af-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {cargando ? <Loader2 size={13} className="animate-spin" /> : icono}
    {children}
  </button>
);

interface AsistenteIAProps {
  titulo: string;
  descripcion: React.ReactNode;
  /** La acción destacada: lo que hace la IA de una sola vez. */
  principal: {
    etiqueta: string;
    onClick: () => void;
    cargando?: boolean;
    disabled?: boolean;
  };
  /** Acción secundaria junto al botón principal (p. ej. «Deshacer»). */
  extra?: React.ReactNode;
  /** Aclaración al pie (p. ej. por qué el botón está apagado). */
  nota?: React.ReactNode;
  className?: string;
}

/**
 * Tarjeta del asistente de IA.
 *
 * Un solo panel para todo el producto: la cara del robot, qué escribe la IA y
 * un botón claro que dice exactamente lo que va a pasar. El fondo lleva un
 * tinte suave del color de marca —plano, sin degradado— para que el asistente
 * se distinga de las tarjetas de formulario sin gritar.
 */
export const AsistenteIA: React.FC<AsistenteIAProps> = ({
  titulo,
  descripcion,
  principal,
  extra,
  nota,
  className = '',
}) => (
  <section className={`rounded-[28px] bg-af-accent/[0.07] p-5 sm:p-6 ${className}`}>
    <div className="flex items-start gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-af-accent text-white">
        <RobotIA size={25} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-bold text-af-ink">{titulo}</h2>
        <p className="mt-1 text-sm leading-relaxed text-af-ink-secondary">{descripcion}</p>
      </div>
    </div>

    <div className="mt-5 flex flex-wrap items-center gap-2.5">
      <Boton
        variante="primario"
        tamanio="mediano"
        onClick={principal.onClick}
        cargando={principal.cargando}
        disabled={principal.disabled}
        icono={<Sparkles size={17} />}
        className="w-full sm:w-auto"
      >
        {principal.etiqueta}
      </Boton>
      {extra}
    </div>

    {nota && <p className="mt-3.5 text-xs leading-relaxed text-af-ink-secondary">{nota}</p>}
  </section>
);
