import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, UtensilsCrossed } from 'lucide-react';
import type { RestauranteDescubierto } from '../../tipos/modelos';
import { formatearPrecio, generarSlug } from '../../lib/utils';
import { AvatarRestaurante } from './AvatarRestaurante';
import { FOCO, FOCO_IMAGEN } from './estilos';

interface TarjetaRestauranteProps {
  restaurante: RestauranteDescubierto;
  /**
   * Cocina por la que se está filtrando. Si el restaurante llegó a la lista por
   * una cocina secundaria, la tarjeta muestra esa, no la principal, para que el
   * resultado explique por qué está ahí.
   */
  cocinaCoincidente?: string | null;
  /** Las primeras tarjetas se ven al cargar y no deben esperar. */
  prioridad?: boolean;
}

/**
 * Un restaurante como perfil.
 *
 * La foto presenta el local, el logo lo firma y el pie responde a la pregunta
 * que decide la entrada: qué cocina, cuántos platos y desde cuánto. Cabe en dos
 * columnas de teléfono sin apretar el texto; en escritorio respira con más aire.
 */
export const TarjetaRestaurante: React.FC<TarjetaRestauranteProps> = ({
  restaurante,
  cocinaCoincidente,
  prioridad = false,
}) => {
  const cocina = cocinaCoincidente || restaurante.tipo_cocina;
  const resumen = restaurante.eslogan || restaurante.descripcion;
  const destino = `/restaurante/${generarSlug(restaurante.nombre)}`;
  const platos = restaurante.platos_cantidad;
  const detalles = [
    platos > 0 ? `${platos} ${platos === 1 ? 'plato' : 'platos'}` : null,
    restaurante.precio_min !== null ? `desde ${formatearPrecio(restaurante.precio_min)}` : null,
  ].filter(Boolean) as string[];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[22px] bg-hearth-card ring-1 ring-hearth-line/60 shadow-warm transition-shadow hover:shadow-warm-lg dark:bg-hearth-night-card dark:ring-white/5 dark:shadow-none dark:hover:shadow-warm-dark">
      <Link
        to={destino}
        aria-label={`Ver el menú de ${restaurante.nombre}`}
        className={`relative block aspect-[16/9] overflow-hidden bg-hearth-oat dark:bg-hearth-night-oat ${FOCO_IMAGEN}`}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center text-hearth-line dark:text-hearth-night-line"
        >
          <UtensilsCrossed size={28} />
        </span>

        {restaurante.imagen_banner_url && (
          <img
            src={restaurante.imagen_banner_url}
            alt=""
            loading={prioridad ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={prioridad ? 'high' : undefined}
            className="relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2B1712]/65 via-[#2B1712]/10 to-transparent"
        />

        {restaurante.ciudad && (
          <span className="absolute right-2 top-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[9.5px] font-bold text-white ring-1 ring-white/20 backdrop-blur-md">
            <MapPin size={10} aria-hidden="true" />
            <span className="truncate">{restaurante.ciudad}</span>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-3 pb-3 sm:px-3.5 sm:pb-3.5">
        <div className="-mt-4 flex items-end justify-between gap-2">
          <AvatarRestaurante
            nombre={restaurante.nombre}
            imagenUrl={restaurante.imagen_logo_url}
            tamano={36}
            className="ring-4 ring-hearth-card dark:ring-hearth-night-card"
          />

          <Link
            to={destino}
            aria-label={`Abrir ${restaurante.nombre}`}
            className={`af-pulsar mb-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-hearth-oat text-hearth-espresso transition-colors hover:bg-hearth-terracotta-soft hover:text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:hover:bg-hearth-night-terracotta-soft dark:hover:text-hearth-night-terracotta-ink ${FOCO}`}
          >
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>

        <h3 className="mt-1.5 line-clamp-2 min-h-[2.6em] text-[13.5px] font-extrabold leading-snug tracking-[-0.01em] text-hearth-espresso sm:line-clamp-1 sm:min-h-0 sm:text-[14.5px] dark:text-hearth-night-ink">
          <Link
            to={destino}
            className={`rounded transition-colors hover:text-hearth-terracotta-ink dark:hover:text-hearth-night-terracotta ${FOCO}`}
          >
            {restaurante.nombre}
          </Link>
        </h3>

        <p className="mt-0.5 line-clamp-1 text-[10.5px] leading-relaxed text-hearth-pebble sm:text-[11.5px] dark:text-hearth-night-pebble">
          {resumen || cocina || 'Menú digital'}
        </p>

        {detalles.length > 0 && (
          <p className="mt-auto pt-2 text-[10.5px] font-semibold tabular-nums text-hearth-pebble sm:text-[11px] dark:text-hearth-night-pebble">
            {detalles.join(' · ')}
          </p>
        )}
      </div>
    </article>
  );
};
