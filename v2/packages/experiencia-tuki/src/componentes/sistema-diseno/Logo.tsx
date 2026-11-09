import React from 'react';

/* ==========================================================================
   MARCA TUKITUKI — sistema modular
   --------------------------------------------------------------------------
   La marca se arma con tres piezas que se pueden usar juntas o por separado:

   1. `SimboloTuki`  — la «T» de la mesa y la chispa de la comunidad.
   2. `PalabraTuki`  — el logotipo tipográfico (Inter Bold, tracking cerrado).
   3. `DescriptorTuki` — la línea de marca en español.

   `MarcaTuki` compone las tres en horizontal o en vertical. Todo se pinta con
   `currentColor`, así que la marca hereda el color del contexto: tinta sobre
   papel, blanco sobre el acento. No hay archivos de color duplicados ni
   variantes que se puedan desincronizar.

   Por qué una «T» y no una «R»: la marca anterior dibujaba una «R» que no
   aparecía en el nombre. La «T» sí deletrea TukiTuki, y su trazo horizontal es la
   mesa donde se comparte la comida; la chispa es lo que se comparte.
   ========================================================================== */

interface SimboloTukiProps {
  size?: number | string;
  className?: string;
  /** Nombre accesible. Si se omite, la marca queda decorativa (aria-hidden). */
  titulo?: string;
}

/**
 * La «T» de la mesa.
 *
 * Dos trazos gruesos y una chispa. El trazo horizontal es la mesa; el vertical
 * la sostiene. La chispa —la misma de `RobotIA`— vive arriba a la derecha,
 * separada de la barra: no es un adorno pegado, es la conversación que ocurre
 * alrededor de la mesa.
 *
 * El grupo se desplaza para que el conjunto quede ópticamente centrado: la «T»
 * ocupa la izquierda y la chispa la esquina superior derecha, igual que en la
 * marca anterior, pero ahora la letra dice el nombre.
 */
export const SimboloTuki: React.FC<SimboloTukiProps> = ({
  size = 24,
  className = '',
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
    <g transform="translate(-1.25 1.35)">
      {/* Mesa: el trazo horizontal de la T. */}
      <path
        d="M4.4 7.6H16"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Patas: el trazo vertical de la T. */}
      <path
        d="M10.2 7.6V19.6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Chispa de la marca: la conversación. */}
      <path
        d="M19.6 1.7Q20.06 3.74 22.1 4.2Q20.06 4.66 19.6 6.7Q19.14 4.66 17.1 4.2Q19.14 3.74 19.6 1.7Z"
        fill="currentColor"
      />
    </g>
  </svg>
);

/** Compatibilidad: los sitios que ya importaban `Logo` siguen funcionando. */
export const Logo = SimboloTuki;

interface PalabraTukiProps {
  /** Tamaño en píxeles del logotipo. */
  tamano?: number;
  className?: string;
}

/**
 * El logotipo tipográfico.
 *
 * Usa la misma familia y el mismo peso que los títulos de la aplicación para
 * que la marca no parezca un injerto. El tracking negativo es deliberado: a
 * tamaños pequeños, «TukiTuki» con el espaciado por defecto se desarma.
 */
export const PalabraTuki: React.FC<PalabraTukiProps> = ({
  tamano = 20,
  className = '',
}) => (
  <span
    className={`font-bold leading-none tracking-[-0.035em] ${className}`}
    style={{ fontSize: tamano }}
  >
    TukiTuki
  </span>
);

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
  tamano = 22,
  variante = 'horizontal',
  conDescriptor = false,
  descriptor = 'La mesa se comparte',
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
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-af-accent-solid text-white"
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
