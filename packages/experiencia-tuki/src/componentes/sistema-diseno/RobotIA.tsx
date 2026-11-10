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
 * antena no termina en un punto cualquiera: termina en la misma llama que lleva
 * la marca en la «i», así que el asistente se lee como parte de TukiTuki y no
 * como un icono genérico de «IA».
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
    {/* Antena: vástago hasta la llama. */}
    <path d="M12 8.75V6.4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    {/* La llama de la marca, en miniatura. */}
    <path
      d="M12 1.1C12.9 2.5 14.1 3.5 14.1 4.8C14.1 5.6 13.2 6.1 12 6.1C10.8 6.1 9.9 5.6 9.9 4.8C9.9 4.1 10.3 3.5 10.8 3C10.6 3.6 10.9 4 11.3 4.2C11.4 3.2 11.5 2.1 12 1.1Z"
      fill="currentColor"
    />
    {/* Ojos. */}
    <circle cx="9.4" cy="13.9" r="1.35" fill="currentColor" />
    <circle cx="14.6" cy="13.9" r="1.35" fill="currentColor" />
    {/* Boca. */}
    <path d="M9.9 16.9H14.1" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);
