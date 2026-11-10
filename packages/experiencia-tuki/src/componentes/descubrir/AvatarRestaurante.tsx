import React from 'react';

interface AvatarRestauranteProps {
  nombre: string;
  imagenUrl?: string | null;
  /** Lado en píxeles. */
  tamano?: number;
  className?: string;
}

/**
 * El retrato de un restaurante.
 *
 * En una red social la cara del autor importa más que su ficha técnica. Si el
 * local subió un logo se usa; si no, la inicial sobre un tinte cálido estable
 * —el mismo nombre siempre recibe el mismo color— para que el feed no parezca
 * una lista de placeholders idénticos.
 */
const TINTES = [
  'bg-hearth-terracotta-soft text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink',
  'bg-hearth-sage-soft text-hearth-sage-ink dark:bg-hearth-night-sage-soft dark:text-hearth-night-sage-ink',
  'bg-hearth-honey-soft text-hearth-honey-ink dark:bg-hearth-night-honey-soft dark:text-hearth-night-honey-ink',
];

export const AvatarRestaurante: React.FC<AvatarRestauranteProps> = ({
  nombre,
  imagenUrl,
  tamano = 32,
  className = '',
}) => {
  const limpio = nombre.trim();
  const inicial = limpio.charAt(0).toUpperCase() || 'T';
  const semilla = Array.from(limpio).reduce((suma, letra) => suma + letra.charCodeAt(0), 0);
  const tinte = TINTES[semilla % TINTES.length];

  if (imagenUrl) {
    return (
      <img
        src={imagenUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        style={{ width: tamano, height: tamano }}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ width: tamano, height: tamano, fontSize: Math.max(9, Math.round(tamano * 0.4)) }}
      className={`flex shrink-0 items-center justify-center rounded-full font-extrabold ${tinte} ${className}`}
    >
      {inicial}
    </span>
  );
};
