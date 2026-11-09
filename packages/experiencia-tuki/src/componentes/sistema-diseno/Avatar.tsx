import React from 'react';
import { iniciales } from '../../modulos/resenas';

interface AvatarProps {
  nombre: string;
  /** Foto del comensal. Si falta, se usan las iniciales. */
  src?: string | null;
  /** Lado en píxeles. 24, 32, 40 o 64. */
  tamano?: number;
  className?: string;
  /** Si se pasa, el avatar deja de ser decorativo y anuncia a quién pertenece. */
  titulo?: string;
}

/**
 * Avatar de una persona.
 *
 * Sin foto no se inventa un color aleatorio: las iniciales van sobre la
 * superficie y heredan la tinta del contexto. Así el mismo avatar sirve en la
 * ficha de un restaurante con cualquier paleta y en el panel neutro.
 */
export const Avatar: React.FC<AvatarProps> = ({
  nombre,
  src,
  tamano = 40,
  className = '',
  titulo,
}) => {
  const etiqueta = titulo || nombre;
  const decorativo = !titulo;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-af-surface font-semibold text-af-ink ${
        decorativo ? 'ring-1 ring-af/20' : ''
      } ${className}`}
      style={{ width: tamano, height: tamano, fontSize: Math.max(10, tamano * 0.36) }}
      role={decorativo ? undefined : 'img'}
      aria-label={decorativo ? undefined : etiqueta}
      aria-hidden={decorativo ? true : undefined}
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{iniciales(nombre)}</span>
      )}
    </span>
  );
};
