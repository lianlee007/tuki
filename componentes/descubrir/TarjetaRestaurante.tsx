import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { Star, UtensilsCrossed } from 'lucide-react';
import type { RestauranteDescubierto } from '../../tipos/modelos';
import { formatearPrecio, generarSlug } from '../../lib/utils';

interface TarjetaRestauranteProps {
  restaurante: RestauranteDescubierto;
  /**
   * Cocina por la que se está filtrando. Si el restaurante llegó a la lista por
   * una cocina secundaria (Donde Lian al filtrar «China»), la tarjeta muestra
   * esa, no la principal, para que el resultado explique por qué está ahí.
   */
  cocinaCoincidente?: string | null;
}

/**
 * La tarjeta del carril de restaurantes.
 *
 * Es deliberadamente más pequeña que la de un plato: aquí se elige a quién
 * entrar, no qué comer. La foto manda y los datos caben en tres líneas.
 */
export const TarjetaRestaurante: React.FC<TarjetaRestauranteProps> = ({
  restaurante,
  cocinaCoincidente,
}) => {
  const tieneRating = restaurante.rating_cantidad > 0;
  const cocina = cocinaCoincidente || restaurante.tipo_cocina;

  return (
    <Link
      to={`/restaurante/${generarSlug(restaurante.nombre)}`}
      className="group block"
      aria-label={`${restaurante.nombre}, ${cocina ?? 'restaurante'}`}
    >
      <div className="af-zoom relative aspect-[16/10] overflow-hidden rounded-[18px] bg-af-surface">
        {restaurante.imagen_banner_url ? (
          <img
            src={restaurante.imagen_banner_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-af-ink-secondary">
            <UtensilsCrossed size={24} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[15px] font-semibold leading-snug tracking-tight text-af-ink">
            {restaurante.nombre}
          </h3>
          {tieneRating && (
            <span className="inline-flex shrink-0 items-center gap-0.5 pt-0.5 text-[12px] font-semibold tabular-nums text-af-ink-secondary">
              <Star size={11} aria-hidden="true" className="fill-current" />
              {restaurante.rating.toFixed(1)}
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-[12px] text-af-ink-secondary">
          {cocina ?? 'Restaurante'}
          {restaurante.ciudad ? ` · ${restaurante.ciudad}` : ''}
        </p>

        <p className="mt-0.5 truncate text-[12px] text-af-ink-secondary">
          {restaurante.platos_cantidad}{' '}
          {restaurante.platos_cantidad === 1 ? 'plato' : 'platos'}
          {restaurante.precio_min !== null
            ? ` · Desde ${formatearPrecio(restaurante.precio_min)}`
            : ''}
        </p>
      </div>
    </Link>
  );
};
