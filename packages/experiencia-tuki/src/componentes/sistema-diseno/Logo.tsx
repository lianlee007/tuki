import React from 'react';
import {
  ASPECTO_TUKI,
  ASPECTO_TUKITUKI,
  TRAZADO_TUKI,
  TRAZADO_TUKITUKI,
  VIEWBOX_TUKI,
  VIEWBOX_TUKITUKI,
} from './marca-trazados';

/* ==========================================================================
   MARCA TUKITUKI 2026 — la chispa se hizo llama
   `SimboloTuki` (mesa y llama), `PalabraTuki` (logotipo con la llama en la «i»)
   y `DescriptorTuki`. Todo se pinta con `currentColor`; la baldosa de
   `MarcaTuki` fija el terracota y el blanco.
   ========================================================================== */

interface SimboloTukiProps {
  size?: number | string;
  className?: string;
  /** Nombre accesible. Si se omite, la marca queda decorativa (aria-hidden). */
  titulo?: string;
}

/**
 * La mesa con la llama.
 *
 * La llama se apoya en el tablero: no flota. Esa unión es la que convierte la
 * marca en una escena —la mesa encendida— y la aleja de un destello genérico.
 */
export const SimboloTuki: React.FC<SimboloTukiProps> = ({
  size = 24,
  className = '',
  titulo,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role={titulo ? 'img' : undefined}
    aria-label={titulo}
    aria-hidden={titulo ? undefined : true}
  >
    <g fill="currentColor">
      {/* La llama: rizo, punta y base redonda sobre el tablero. */}
      <path d="M30 32.5 C27 30.5 24 26 24.5 21 C25 17 27 14 29.5 11.5 C29 14.5 30 16.5 31.5 17.5 C32 14 32 11 33 8.5 C36 12.5 39.5 16.5 39 22 C38.5 27 35.5 30.5 34 32.5 C32.7 33.5 31.3 33.5 30 32.5 Z" />
      {/* El tablero y las dos patas. */}
      <rect x="12" y="32.5" width="40" height="7" rx="3.5" />
      <rect x="18" y="39.5" width="6" height="12" rx="2" />
      <rect x="40" y="39.5" width="6" height="12" rx="2" />
    </g>
  </svg>
);

/** Compatibilidad: los sitios que ya importaban `Logo` siguen funcionando. */
export const Logo = SimboloTuki;

interface PalabraTukiProps {
  /** Alto del logotipo en píxeles. El ancho lo pone la proporción del trazado. */
  tamano?: number;
  className?: string;
  /** «Tuki» para el producto; «TukiTuki» para el mercado. */
  nombre?: 'Tuki' | 'TukiTuki';
}

/**
 * El logotipo trazado, con la llama sustituyendo al punto de la «i».
 *
 * No usa texto vivo: el trazado viaja con el componente y no depende de que la
 * fuente esté cargada. La llama mide 165 × 250 unidades y sube por encima de la
 * altura de las mayúsculas, así que el nombre gana un remate propio.
 */
export const PalabraTuki: React.FC<PalabraTukiProps> = ({
  tamano = 20,
  className = '',
  nombre = 'Tuki',
}) => {
  const largo = nombre === 'TukiTuki';
  const viewBox = largo ? VIEWBOX_TUKITUKI : VIEWBOX_TUKI;
  const aspecto = largo ? ASPECTO_TUKITUKI : ASPECTO_TUKI;
  const trazado = largo ? TRAZADO_TUKITUKI : TRAZADO_TUKI;

  return (
    <svg
      width={tamano * aspecto}
      height={tamano}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={nombre}
      style={{ display: 'block' }}
    >
      <path fill="currentColor" d={trazado} />
    </svg>
  );
};

interface DescriptorTukiProps {
  children?: React.ReactNode;
  className?: string;
  /** Tamaño en píxeles. Por defecto acompaña a un logotipo de 20 px. */
  tamano?: number;
}

/** La línea de marca en español. Se usa solo cuando hay espacio para leerla. */
export const DescriptorTuki: React.FC<DescriptorTukiProps> = ({
  children = 'La mesa se comparte',
  className = '',
  tamano = 12,
}) => (
  <span
    className={`block font-medium leading-snug text-af-ink-secondary ${className}`}
    style={{ fontSize: tamano }}
  >
    {children}
  </span>
);

interface MarcaTukiProps {
  /** Lado del símbolo en píxeles. El logotipo y el descriptor escalan con él. */
  tamano?: number;
  /** Horizontal para barras; apilada para portadas y piezas cuadradas. */
  variante?: 'horizontal' | 'apilada';
  /** Muestra la línea de marca debajo del logotipo. */
  conDescriptor?: boolean;
  descriptor?: string;
  /** «Tuki» para el producto; «TukiTuki» para el mercado. */
  nombre?: 'Tuki' | 'TukiTuki';
  /** Fondo terracota con la marca en blanco. Desactívalo sobre papel o foto. */
  conFondo?: boolean;
  className?: string;
  /** Nombre accesible. Vacío para dejar la marca como decorativa. */
  titulo?: string;
}

/**
 * La marca completa.
 *
 * No fija colores propios: el contenedor decide con `text-*`. Eso permite la
 * misma pieza en la barra de Descubrir, en el panel, en el pie de la landing y
 * en la pantalla de carga sin duplicar componentes.
 */
export const MarcaTuki: React.FC<MarcaTukiProps> = ({
  tamano = 24,
  variante = 'horizontal',
  conDescriptor = false,
  descriptor = 'La mesa se comparte',
  nombre = 'Tuki',
  conFondo = true,
  className = '',
  titulo = 'TukiTuki',
}) => {
  const lado = tamano + 12;
  const etiqueta = [titulo, conDescriptor ? descriptor : null].filter(Boolean).join('. ');

  return (
    <span
      className={`inline-flex ${
        variante === 'horizontal'
          ? 'items-center gap-2.5'
          : 'flex-col items-center gap-2 text-center'
      } ${className}`}
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta || undefined}
      aria-hidden={etiqueta ? undefined : true}
    >
      {conFondo ? (
        <span
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-af-accent-solid text-white"
          style={{ width: lado, height: lado }}
        >
          <SimboloTuki size={tamano} />
        </span>
      ) : (
        <SimboloTuki size={tamano} className="shrink-0 text-af-accent-text" />
      )}

      <span className="flex min-w-0 flex-col">
        <PalabraTuki
          tamano={tamano * 0.92}
          nombre={nombre}
          className={variante === 'apilada' ? 'text-center' : ''}
        />
        {conDescriptor && (
          <DescriptorTuki
            tamano={Math.max(11, Math.round(tamano * 0.46))}
            className={variante === 'apilada' ? 'mt-1 text-center' : 'mt-1'}
          >
            {descriptor}
          </DescriptorTuki>
        )}
      </span>
    </span>
  );
};
