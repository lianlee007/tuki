import React from 'react';

interface RobotIAProps {
  size?: number | string;
  className?: string;
  strokeWidth?: number;
  /** Nombre accesible. Si se omite, el icono queda decorativo (aria-hidden). */
  titulo?: string;
}

/**
 * ASISTENTE TUKI — la cabeza del robot.
 *
 * Tres trazos y nada más: una cabeza redondeada, una antena y dos ojos. La
 * antena termina en una chispa de cuatro puntas: es el acento del asistente.
 * La marca de Tuki ya no usa esa chispa —su símbolo es la T-mesa—, así que el
 * asistente tiene su propia figura sin competir con el logo.
 *
 * Todo se pinta con `currentColor` y un solo grosor de trazo, para que herede
 * el color del texto y encaje con el resto de iconos. Los ojos y la chispa van
 * rellenos: a 16 px un trazo fino se perdería y la cara dejaría de leerse.
 */
export const RobotIA: React.FC<RobotIAProps> = ({
  size = 20,
  className = '',
  strokeWidth = 1.9,
  titulo,
}) => (
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
    {/* Cabeza. */}
    <rect
      x="4.25"
      y="8.75"
      width="15.5"
      height="10.5"
      rx="4.25"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    />
    {/* Antena: vástago hasta la chispa. */}
    <path d="M12 8.75V6.4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    {/* Chispa de la marca, en miniatura. */}
    <path
      d="M12 1.4Q12.29 3.36 14.25 3.65Q12.29 3.94 12 5.9Q11.71 3.94 9.75 3.65Q11.71 3.36 12 1.4Z"
      fill="currentColor"
    />
    {/* Ojos. */}
    <circle cx="9.4" cy="13.9" r="1.35" fill="currentColor" />
    <circle cx="14.6" cy="13.9" r="1.35" fill="currentColor" />
    {/* Boca. */}
    <path d="M9.9 16.9H14.1" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);
