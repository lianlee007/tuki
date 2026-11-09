import React from 'react';

/* ==========================================================================
   MARCA TUKI — sistema modular
   --------------------------------------------------------------------------
   La marca se arma con tres piezas que se pueden usar juntas o por separado:

   1. `SimboloTuki`  — la «T» construida como una mesa de pedestal.
   2. `PalabraTuki`  — el logotipo tipográfico (Plus Jakarta Sans 800).
   3. `DescriptorTuki` — la línea de marca en español.

   `MarcaTuki` compone las tres en horizontal o en vertical. Todo se pinta con
   `currentColor`, así que la marca hereda el color del contexto: tinta sobre
   papel, blanco sobre el acento. No hay archivos de color duplicados ni
   variantes que se puedan desincronizar.

   Por qué una mesa de pedestal: la «T» es el tablero, la columna y la base de
   una mesa de restaurante. De un solo golpe dice el nombre (T de Tuki) y el
   producto (la mesa donde se comparte la comida). La chispa anterior se
   retiró: a 16 px no sobrevivía y competía con la letra. El símbolo ahora es
   una sola silueta, legible en el favicon y en la baldosa de la aplicación.
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
 * Tres piezas sólidas, sin trazos finos: el tablero (barra superior), la
 * columna (asta) y la base (pedestal). La barra y la base tienen los extremos
 * redondeados; las esquinas interiores quedan vivas, como una unión de madera.
 *
 * El lienzo es de 64 × 64 y la marca ocupa 44 × 50.5, con aire suficiente para
 * que la baldosa respire y para que a 16 px el trazo no toque el borde.
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
    {/* Tablero: la barra superior de la T y la superficie donde se comparte. */}
    <rect x="10" y="7.5" width="44" height="10" rx="5" fill="currentColor" />
    {/* Columna: el asta que sostiene la mesa y completa la T. */}
    <rect x="27" y="17" width="10" height="33.5" fill="currentColor" />
    {/* Base: el pedestal que apoya la mesa en el suelo. */}
    <rect x="17.5" y="50" width="29" height="8" rx="4" fill="currentColor" />
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
 * Usa Plus Jakarta Sans, la misma familia de la portada, para que la marca
 * tenga voz propia sin salirse del sistema. El tracking negativo es
 * deliberado: a tamaños pequeños, «Tuki» con el espaciado por defecto se
 * desarma.
 */
export const PalabraTuki: React.FC<PalabraTukiProps> = ({
  tamano = 20,
  className = '',
}) => (
  <span
    className={`font-jakarta font-extrabold leading-none tracking-[-0.045em] ${className}`}
    style={{ fontSize: tamano }}
  >
    Tuki
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
 *
 * La baldosa usa el mismo radio proporcional que el favicon (24 % del lado)
 * para que la marca se vea igual en la pestaña y dentro de la aplicación.
 */
export const MarcaTuki: React.FC<MarcaTukiProps> = ({
  tamano = 22,
  variante = 'horizontal',
  conDescriptor = false,
  descriptor = 'La mesa se comparte',
  conFondo = true,
  className = '',
  titulo = 'Tuki',
}) => {
  const lado = tamano + 10;
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
          className="inline-flex shrink-0 items-center justify-center bg-af-accent-solid text-white"
          style={{ width: lado, height: lado, borderRadius: lado * 0.24 }}
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
