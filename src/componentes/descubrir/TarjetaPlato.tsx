import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowUpRight, Plus, Star, UtensilsCrossed } from 'lucide-react';
import type { PlatoDescubierto } from '../../tipos/modelos';
import { formatearPrecio, generarSlug } from '../../lib/utils';

interface TarjetaPlatoProps {
  plato: PlatoDescubierto;
  /** El primero del feed ocupa dos columnas: rompe la retícula idéntica. */
  destacado?: boolean;
  /** Abre el carrito. La tarjeta entera sigue siendo el enlace al menú. */
  onAgregar?: (plato: PlatoDescubierto) => void;
}

/**
 * Una tarjeta del feed.
 *
 * Cuenta cuatro cosas y calla el resto: qué es, de quién es, cuánto cuesta y
 * cómo se llega. Sin insignias ni sombras en reposo. El enlace se estira sobre
 * toda la tarjeta y el botón de agregar vive por encima: así un clic en
 * cualquier parte abre el menú, salvo el círculo que suma al carrito.
 */
export const TarjetaPlato: React.FC<TarjetaPlatoProps> = ({
  plato,
  destacado = false,
  onAgregar,
}) => {
  const dietas = [
    plato.vegetariano ? 'Vegetariano' : null,
    plato.vegano ? 'Vegano' : null,
    plato.picante ? 'Picante' : null,
  ].filter(Boolean) as string[];

  const tieneRating = plato.rating_cantidad > 0;

  return (
    <article className={`group relative ${destacado ? 'sm:col-span-2' : ''}`}>
      <div className="af-zoom relative overflow-hidden rounded-[22px] bg-af-surface">
        {plato.imagen_url ? (
          <img
            src={plato.imagen_url}
            alt={plato.nombre}
            loading="lazy"
            decoding="async"
            className={`w-full object-cover ${destacado ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}
          />
        ) : (
          <div
            className={`flex w-full items-center justify-center text-af-ink-secondary ${
              destacado ? 'aspect-[16/9]' : 'aspect-[4/3]'
            }`}
          >
            <UtensilsCrossed size={28} aria-hidden="true" />
          </div>
        )}

        {onAgregar && (
          <button
            type="button"
            onClick={() => onAgregar(plato)}
            aria-label={`Agregar ${plato.nombre} al carrito`}
            title="Agregar al carrito"
            className="af-pulsar absolute bottom-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-af-ground text-af-ink transition-transform hover:scale-105 active:scale-95"
          >
            <Plus size={19} strokeWidth={2.4} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="pt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[17px] font-semibold leading-snug tracking-tight text-af-ink">
            <Link
              to={`/restaurante/${generarSlug(plato.restaurante_nombre)}?plato=${plato.id}`}
              className="after:absolute after:inset-0 after:z-0 after:content-['']"
              aria-label={`${plato.nombre}, de ${plato.restaurante_nombre}`}
            >
              {plato.nombre}
            </Link>
          </h3>
          <span className="shrink-0 pt-0.5 text-[15px] font-semibold tabular-nums text-af-ink">
            {formatearPrecio(plato.precio)}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-[13px] text-af-ink-secondary">
          <span className="truncate">{plato.restaurante_nombre}</span>
          {plato.tipo_cocina && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{plato.tipo_cocina}</span>
            </>
          )}
          {tieneRating && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-0.5">
                <Star size={12} aria-hidden="true" className="fill-current" />
                {plato.rating.toFixed(1)}
              </span>
            </>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="truncate text-[12px] text-af-ink-secondary">
            {dietas.length > 0 ? dietas.join(' · ') : plato.categoria || ''}
          </p>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-af-ink-secondary transition-colors group-hover:text-af-accent-text">
            Ver menú
            <ArrowUpRight size={13} aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  );
};
