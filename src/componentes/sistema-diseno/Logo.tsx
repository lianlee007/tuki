import React from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
  /** Nombre accesible. Si se omite, la marca queda decorativa (aria-hidden). */
  titulo?: string;
}

/**
 * MARCA TUKI — la «R» del plato.
 *
 * Dos piezas y nada más. Una «R» geométrica de trazo redondeado cuyo cuenco es
 * un semicírculo: media campana de restaurante, medio plato. Y una chispa de
 * cuatro puntas con los lados hundidos hacia el centro, en la esquina superior
 * derecha, que es lo único relleno del dibujo (por eso la marca no se emborrona
 * a 16 px, donde un trazo fino se perdería).
 *
 * Todo se pinta con `currentColor`: blanco sobre el acento, tinta sobre el
 * papel. Ni variantes ni archivos extra.
 *
 * El grupo lleva una transformación para que el conjunto quede ópticamente
 * centrado: la «R» ocupa abajo a la izquierda y la chispa arriba a la derecha.
 */
export const Logo: React.FC<LogoProps> = ({ size = 24, className = '', titulo }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <g transform="translate(12 12) scale(1.06) translate(-12.4 -11.05)">
        {/* R: asta, cuenco semicircular y pierna. */}
        <path
          d="M6 5V19M6 5A4.5 4.5 0 0 1 6 14M9.69 12.08 14.5 19"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Chispa. */}
        <path
          d="M16.5 2.1Q16.942 5.058 19.9 5.5Q16.942 5.942 16.5 8.9Q16.058 5.942 13.1 5.5Q16.058 5.058 16.5 2.1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
};
