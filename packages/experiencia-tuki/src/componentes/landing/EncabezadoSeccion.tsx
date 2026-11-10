import React from 'react';

interface Props {
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  /** Centro para las secciones que se leen en voz alta; izquierda para las que
   *  se leen como una lista. */
  alineacion?: 'centro' | 'izquierda';
  className?: string;
}

/**
 * Cabecera compartida de la landing.
 *
 * Antes abría cada sección una ceja en mayúsculas («PLANES», «TRES PASOS»,
 * «SIN COMISIONES») que repetía lo que ya decía el titular. Se fueron todas:
 * el titular solo ya carga la jerarquía y la página respira. La única etiqueta
 * pequeña que queda es la del héroe, que sí aporta contexto.
 */
export const EncabezadoSeccion: React.FC<Props> = ({
  titulo,
  descripcion,
  alineacion = 'centro',
  className = '',
}) => {
  const centrado = alineacion === 'centro';

  return (
    <div
      className={`${centrado ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'} ${className}`}
    >
      <h2 className="text-balance font-jakarta text-[1.8rem] font-extrabold leading-[1.08] tracking-[-0.035em] text-af-ink sm:text-[2.25rem] md:text-[2.7rem]">
        {titulo}
      </h2>

      {descripcion && (
        <p
          className={`mt-4 text-pretty text-[1rem] leading-relaxed text-af-ink-secondary sm:text-[1.0625rem] ${
            centrado ? 'mx-auto max-w-xl' : 'max-w-lg'
          }`}
        >
          {descripcion}
        </p>
      )}
    </div>
  );
};
