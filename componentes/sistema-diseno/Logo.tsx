import React from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
}

/**
 * SMART CLOCHE LOGO
 * Diseño minimalista y geométrico.
 * Representa una campana de restaurante (Cloche) estilizada.
 * El asa tradicional se reemplaza por un círculo flotante (Nodo/IA).
 */
export const Logo: React.FC<LogoProps> = ({ size = 24, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="SmartFood Logo"
    >
      {/* Nodo IA (Asa flotante) - Círculo sólido */}
      <circle cx="12" cy="5" r="2.5" fill="currentColor" />

      {/* Cúpula (Cloche) - Arco geométrico grueso */}
      <path
        d="M19 18C19 14.134 15.866 11 12 11C8.13401 11 5 14.134 5 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Base (Plato) - Línea sólida redondeada */}
      <path
        d="M3 21H21"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};