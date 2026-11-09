import React from 'react';
import { Star } from 'lucide-react';

interface EstrellasProps {
  /** Nota entre 0 y 5. Se admite decimal para el promedio. */
  valor: number;
  /** Número de reseñas que sostienen el promedio. */
  cantidad?: number;
  /** Lado de cada estrella en píxeles. */
  tamano?: number;
  /** Muestra el número al lado (4,9). */
  conNumero?: boolean;
  className?: string;
  /** Si se pasa, las estrellas se pueden pulsar. */
  onCambiar?: (valor: number) => void;
  /** Etiqueta accesible cuando no se usa `cantidad`. */
  etiqueta?: string;
}

/**
 * Estrellas de TukiTuki.
 *
 * Dos capas: cinco estrellas apagadas y encima el mismo grupo recortado al
 * porcentaje de la nota. Así un 4,6 se ve como 4,6 y no como 5. En modo
 * interactivo son cinco botones reales, no un `div` con `onClick`, para que se
 * puedan recorrer y activar con el teclado.
 *
 * Todo se pinta con `currentColor`: en la portada el padre pone blanco; en una
 * tarjeta, el acento del restaurante.
 */
export const Estrellas: React.FC<EstrellasProps> = ({
  valor,
  cantidad,
  tamano = 16,
  conNumero = false,
  className = '',
  onCambiar,
  etiqueta,
}) => {
  const nota = Math.max(0, Math.min(5, Number(valor) || 0));
  const interactivo = typeof onCambiar === 'function';
  const descripcion =
    etiqueta ||
    `${nota.toFixed(1)} de 5${cantidad !== undefined ? `, ${cantidad} reseñas` : ''}`;

  if (interactivo) {
    return (
      <div
        className={`inline-flex items-center gap-1 ${className}`}
        role="group"
        aria-label="Calificación"
      >
        {[1, 2, 3, 4, 5].map((estrella) => {
          const activa = estrella <= nota;
          return (
            <button
              key={estrella}
              type="button"
              onClick={() => onCambiar?.(estrella)}
              aria-label={`${estrella} ${estrella === 1 ? 'estrella' : 'estrellas'}`}
              aria-pressed={activa}
              className="rounded-full p-0.5 outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-af-accent/50"
            >
              <Star
                size={tamano}
                aria-hidden="true"
                className={activa ? 'fill-current' : 'opacity-35'}
              />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      role="img"
      aria-label={descripcion}
    >
      <span className="relative inline-flex" aria-hidden="true">
        <span className="flex gap-0.5 opacity-30">
          {[1, 2, 3, 4, 5].map((estrella) => (
            <Star key={estrella} size={tamano} className="shrink-0" />
          ))}
        </span>
        <span
          className="absolute left-0 top-0 flex gap-0.5 overflow-hidden"
          style={{ width: `${(nota / 5) * 100}%` }}
        >
          {[1, 2, 3, 4, 5].map((estrella) => (
            <Star key={estrella} size={tamano} className="shrink-0 fill-current" />
          ))}
        </span>
      </span>

      {conNumero && (
        <span className="text-[13px] font-semibold tabular-nums">
          {nota.toFixed(1)}
          {cantidad !== undefined && (
            <span className="ml-1 font-normal opacity-70">({cantidad})</span>
          )}
        </span>
      )}
    </span>
  );
};
