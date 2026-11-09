import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Star, UtensilsCrossed } from 'lucide-react';
import type { RestauranteDescubierto } from '../../tipos/modelos';
import { formatearPrecio, generarSlug } from '../../lib/utils';
import { FOCO, TARJETA_INTERACTIVA } from './estilos';

interface TarjetaRestauranteProps {
  restaurante: RestauranteDescubierto;
  /**
   * Cocina por la que se está filtrando. Si el restaurante llegó a la lista por
   * una cocina secundaria, la tarjeta muestra esa, no la principal, para que el
   * resultado explique por qué está ahí.
   */
  cocinaCoincidente?: string | null;
}

/**
 * La tarjeta de un restaurante aliado.
 *
 * La foto manda y el pie responde a una sola pregunta: ¿vale la pena entrar?
 * Cocina, ciudad, cuántos platos hay y desde cuánto. El botón «Ver menú» repite
 * el enlace de la foto para que en móvil no haya que apuntar a la imagen.
 */
export const TarjetaRestaurante: React.FC<TarjetaRestauranteProps> = ({
  restaurante,
  cocinaCoincidente,
}) => {
  const tieneRating = restaurante.rating_cantidad > 0;
  const cocina = cocinaCoincidente || restaurante.tipo_cocina;
  const resumen = restaurante.eslogan || restaurante.descripcion;
  const destino = `/restaurante/${generarSlug(restaurante.nombre)}`;

  return (
    <article className={`group flex h-full flex-col overflow-hidden ${TARJETA_INTERACTIVA}`}>
      <Link
        to={destino}
        className={`relative block aspect-[16/10] overflow-hidden bg-hearth-oat dark:bg-hearth-night-oat ${FOCO}`}
      >
        {restaurante.imagen_banner_url ? (
          <img
            src={restaurante.imagen_banner_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-hearth-pebble dark:text-hearth-night-pebble">
            <UtensilsCrossed size={30} aria-hidden="true" />
          </div>
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#2B1712]/80 via-[#2B1712]/20 to-transparent"
        />

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-xl bg-hearth-card/95 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-hearth-espresso shadow-warm backdrop-blur-md ring-1 ring-white/50 dark:bg-hearth-night-card/95 dark:text-hearth-night-ink dark:ring-white/10">
            <span className="h-2 w-2 shrink-0 rounded-full bg-hearth-terracotta dark:bg-hearth-night-terracotta" />
            <span className="truncate">{restaurante.nombre}</span>
          </span>

          {tieneRating && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-[#FFD79A] ring-1 ring-white/25 backdrop-blur-md">
              <Star size={12} aria-hidden="true" className="fill-current" />
              {restaurante.rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 text-white">
          <span className="truncate text-[12px] font-semibold drop-shadow">
            {resumen || cocina || 'Cocina de la casa'}
          </span>
          {restaurante.ciudad && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-white/85">
              <MapPin size={12} aria-hidden="true" />
              {restaurante.ciudad}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-hearth-espresso dark:text-hearth-night-ink">
            {cocina ?? 'Restaurante'}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-hearth-pebble dark:text-hearth-night-pebble">
            {restaurante.platos_cantidad}{' '}
            {restaurante.platos_cantidad === 1 ? 'plato' : 'platos'}
            {restaurante.precio_min !== null
              ? ` · Desde ${formatearPrecio(restaurante.precio_min)}`
              : ''}
          </p>
        </div>

        <Link
          to={destino}
          className={`af-pulsar inline-flex shrink-0 items-center gap-1 rounded-xl bg-hearth-oat px-3 py-2 text-[12px] font-bold text-hearth-espresso transition-colors hover:bg-hearth-terracotta-soft hover:text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:hover:bg-hearth-night-terracotta-soft dark:hover:text-hearth-night-terracotta-ink ${FOCO}`}
        >
          Ver menú
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
};
