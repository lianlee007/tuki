import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, Plus, Sparkles, Star, UtensilsCrossed } from 'lucide-react';
import type { PlatoDescubierto } from '../../tipos/modelos';
import { formatearPrecio, generarSlug } from '../../lib/utils';
import {
  BOTON_PRIMARIO,
  BOTON_SUAVE,
  ETIQUETA,
  FOCO,
  INSIGNIA_CALIDA,
  INSIGNIA_FRESCA,
  TARJETA_INTERACTIVA,
} from './estilos';

interface TarjetaPlatoProps {
  plato: PlatoDescubierto;
  /** El primero del feed lleva una marca discreta de sugerencia. */
  destacado?: boolean;
  esFavorito?: boolean;
  /** Abre el carrito. La tarjeta sigue siendo el enlace al menú. */
  onAgregar?: (plato: PlatoDescubierto) => void;
  /** Abre la ficha rápida sin salir de la portada. */
  onVerDetalle?: (plato: PlatoDescubierto) => void;
  onFavorito?: (plato: PlatoDescubierto) => void;
}

/**
 * Una tarjeta del feed.
 *
 * Cuenta cuatro cosas y calla el resto: qué es, de quién es, cuánto cuesta y
 * cómo se llega. La foto lleva la etiqueta del restaurante y el corazón; el pie
 * lleva el precio y las dos acciones. La ficha rápida existe para decidir sin
 * perder el sitio donde se estaba mirando.
 */
export const TarjetaPlato: React.FC<TarjetaPlatoProps> = ({
  plato,
  destacado = false,
  esFavorito = false,
  onAgregar,
  onVerDetalle,
  onFavorito,
}) => {
  const tieneRating = plato.rating_cantidad > 0;
  const dietas = [
    plato.vegano ? 'Vegano' : plato.vegetariano ? 'Vegetariano' : null,
    plato.picante ? 'Picante' : null,
  ].filter(Boolean) as string[];
  const destino = `/restaurante/${generarSlug(plato.restaurante_nombre)}?plato=${plato.id}`;

  return (
    <article className={`group flex h-full flex-col overflow-hidden p-3.5 ${TARJETA_INTERACTIVA}`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-hearth-oat dark:bg-hearth-night-oat">
        <Link
          to={destino}
          aria-label={`Ver el menú de ${plato.restaurante_nombre}`}
          className={`block h-full w-full ${FOCO}`}
        >
          {plato.imagen_url ? (
            <img
              src={plato.imagen_url}
              alt={plato.nombre}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-hearth-pebble dark:text-hearth-night-pebble">
              <UtensilsCrossed size={30} aria-hidden="true" />
            </span>
          )}
        </Link>

        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          <span className="pointer-events-auto inline-flex min-w-0 items-center gap-1.5 rounded-xl bg-hearth-card/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-hearth-espresso shadow-warm ring-1 ring-white/50 backdrop-blur-md dark:bg-hearth-night-card/95 dark:text-hearth-night-ink dark:ring-white/10">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-hearth-terracotta dark:bg-hearth-night-terracotta" />
            <span className="truncate">{plato.restaurante_nombre}</span>
          </span>

          {onFavorito && (
            <button
              type="button"
              onClick={() => onFavorito(plato)}
              aria-pressed={esFavorito}
              aria-label={
                esFavorito
                  ? `Quitar ${plato.nombre} de favoritos`
                  : `Guardar ${plato.nombre} en favoritos`
              }
              title={esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              className={`af-pulsar pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hearth-card/95 shadow-warm ring-1 ring-white/50 backdrop-blur-md transition-colors hover:scale-105 dark:bg-hearth-night-card/95 dark:ring-white/10 ${FOCO} ${
                esFavorito
                  ? 'text-hearth-terracotta-ink dark:text-hearth-night-terracotta'
                  : 'text-hearth-pebble dark:text-hearth-night-pebble'
              }`}
            >
              <Heart
                size={17}
                aria-hidden="true"
                className={esFavorito ? 'fill-current' : undefined}
              />
            </button>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex flex-wrap items-center gap-1.5">
          {destacado && (
            <span className="inline-flex items-center gap-1 rounded-full bg-hearth-honey px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#3A2000] shadow-warm">
              <Sparkles size={11} aria-hidden="true" />
              Sugerido
            </span>
          )}
          {dietas.map((dieta) => (
            <span
              key={dieta}
              className={`${dieta === 'Picante' ? INSIGNIA_CALIDA : INSIGNIA_FRESCA} shadow-warm backdrop-blur-sm`}
            >
              {dieta}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-[16px] font-bold leading-snug tracking-[-0.01em] text-hearth-espresso dark:text-hearth-night-ink">
            <Link
              to={destino}
              className={`transition-colors hover:text-hearth-terracotta-ink dark:hover:text-hearth-night-terracotta ${FOCO} rounded`}
            >
              {plato.nombre}
            </Link>
          </h3>
          {tieneRating && (
            <span className="inline-flex shrink-0 items-center gap-1 pt-0.5 text-[12px] font-bold tabular-nums text-hearth-honey-ink dark:text-hearth-night-honey-ink">
              <Star size={12} aria-hidden="true" className="fill-current" />
              {plato.rating.toFixed(1)}
            </span>
          )}
        </div>

        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
          {plato.descripcion?.trim() ||
            `${plato.tipo_cocina || 'Cocina de la casa'}${plato.ciudad ? ` en ${plato.ciudad}` : ''}.`}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-hearth-pebble dark:text-hearth-night-pebble">
          {plato.tipo_cocina && <span className="truncate">{plato.tipo_cocina}</span>}
          {plato.ciudad && (
            <>
              <span aria-hidden="true" className="text-hearth-line dark:text-hearth-night-line">
                ·
              </span>
              <span className="truncate">{plato.ciudad}</span>
            </>
          )}
          {plato.categoria && (
            <>
              <span aria-hidden="true" className="text-hearth-line dark:text-hearth-night-line">
                ·
              </span>
              <span className="truncate">{plato.categoria}</span>
            </>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3.5">
          <div className="min-w-0">
            <span className={`block ${ETIQUETA} text-[9px] text-hearth-pebble dark:text-hearth-night-pebble`}>
              Precio final
            </span>
            <span className="font-jakarta text-lg font-extrabold tabular-nums tracking-[-0.02em] text-hearth-espresso dark:text-hearth-night-ink">
              {formatearPrecio(plato.precio)}
              <span className="ml-1 text-[10px] font-semibold text-hearth-pebble dark:text-hearth-night-pebble">
                COP
              </span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {onVerDetalle && (
              <button
                type="button"
                onClick={() => onVerDetalle(plato)}
                aria-label={`Ver el detalle de ${plato.nombre}`}
                className={`${BOTON_SUAVE} px-2.5 py-2 text-[12px]`}
              >
                <ArrowUpRight size={15} aria-hidden="true" />
                <span className="hidden sm:inline">Detalle</span>
              </button>
            )}
            {onAgregar && (
              <button
                type="button"
                onClick={() => onAgregar(plato)}
                aria-label={`Añadir ${plato.nombre} al carrito`}
                className={`${BOTON_PRIMARIO} px-2.5 py-2 text-[12px]`}
              >
                <Plus size={15} strokeWidth={2.6} aria-hidden="true" />
                <span className="hidden sm:inline">Añadir</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
