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
  /** Las primeras tarjetas del feed se ven al cargar. */
  prioridad?: boolean;
}

/**
 * Una tarjeta del feed.
 *
 * En escritorio cuenta cuatro cosas y calla el resto: qué es, de quién es,
 * cuánto cuesta y cómo se llega. En móvil el feed pasa a dos columnas y la
 * tarjeta se queda con lo que se decide con el pulgar: foto, nombre, lugar y
 * precio. La descripción, la cocina y la ciudad esperan a `sm`, y el botón de
 * añadir salta encima de la foto para no gastar una fila entera. El primer
 * plato ocupa las dos columnas: es la sugerencia del día, no un ítem más.
 */
export const TarjetaPlato: React.FC<TarjetaPlatoProps> = ({
  plato,
  destacado = false,
  esFavorito = false,
  onAgregar,
  onVerDetalle,
  onFavorito,
  prioridad = false,
}) => {
  const tieneRating = plato.rating_cantidad > 0;
  const dietas = [
    plato.vegano ? 'Vegano' : plato.vegetariano ? 'Vegetariano' : null,
    plato.picante ? 'Picante' : null,
  ].filter(Boolean) as string[];
  const destino = `/restaurante/${generarSlug(plato.restaurante_nombre)}?plato=${plato.id}`;

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden p-2.5 sm:p-3.5 ${TARJETA_INTERACTIVA} ${
        destacado ? 'col-span-2 sm:col-span-1' : ''
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-hearth-oat dark:bg-hearth-night-oat ${
          destacado ? 'aspect-[16/10] sm:aspect-[4/3]' : 'aspect-[4/3]'
        }`}
      >
        <Link
          to={destino}
          aria-label={`Ver el menú de ${plato.restaurante_nombre}`}
          className={`block h-full w-full ${FOCO}`}
        >
          {plato.imagen_url ? (
            <img
              src={plato.imagen_url}
              alt={plato.nombre}
              loading={prioridad ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={prioridad ? 'high' : undefined}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-hearth-pebble dark:text-hearth-night-pebble">
              <UtensilsCrossed size={30} aria-hidden="true" />
            </span>
          )}
        </Link>

        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          <span className="pointer-events-auto hidden min-w-0 items-center gap-1.5 rounded-xl bg-hearth-card/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-hearth-espresso shadow-warm ring-1 ring-white/50 backdrop-blur-md sm:inline-flex dark:bg-hearth-night-card/95 dark:text-hearth-night-ink dark:ring-white/10">
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
              className={`af-pulsar pointer-events-auto ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hearth-card/95 shadow-warm ring-1 ring-white/50 backdrop-blur-md transition-colors hover:scale-105 dark:bg-hearth-night-card/95 dark:ring-white/10 ${FOCO} ${
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
          {dietas.length > 0 && (
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              {dietas.map((dieta) => (
                <span
                  key={dieta}
                  className={`${dieta === 'Picante' ? INSIGNIA_CALIDA : INSIGNIA_FRESCA} shadow-warm backdrop-blur-sm`}
                >
                  {dieta}
                </span>
              ))}
            </span>
          )}
        </div>

        {onAgregar && (
          <button
            type="button"
            onClick={() => onAgregar(plato)}
            aria-label={`Añadir ${plato.nombre} al carrito`}
            className={`af-pulsar pointer-events-auto absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-hearth-terracotta-deep text-white shadow-warm transition-colors hover:bg-hearth-terracotta-ink sm:hidden ${FOCO}`}
          >
            <Plus size={17} strokeWidth={2.6} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-2.5 sm:pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 line-clamp-2 text-[14px] font-bold leading-snug tracking-[-0.01em] text-hearth-espresso sm:text-[16px] dark:text-hearth-night-ink">
            <Link
              to={destino}
              className={`transition-colors hover:text-hearth-terracotta-ink dark:hover:text-hearth-night-terracotta ${FOCO} rounded`}
            >
              {plato.nombre}
            </Link>
          </h3>
          {tieneRating && (
            <span className="hidden shrink-0 items-center gap-1 pt-0.5 text-[12px] font-bold tabular-nums text-hearth-honey-ink sm:inline-flex dark:text-hearth-night-honey-ink">
              <Star size={12} aria-hidden="true" className="fill-current" />
              {plato.rating.toFixed(1)}
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-[10.5px] font-semibold text-hearth-terracotta-ink sm:hidden dark:text-hearth-night-terracotta-ink">
          {plato.restaurante_nombre}
        </p>

        <p
          className={`mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble ${
            destacado ? '' : 'hidden sm:block'
          }`}
        >
          {plato.descripcion?.trim() ||
            `${plato.tipo_cocina || 'Cocina de la casa'}${plato.ciudad ? ` en ${plato.ciudad}` : ''}.`}
        </p>

        <div
          className={`mt-1.5 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-hearth-pebble dark:text-hearth-night-pebble ${
            destacado ? 'flex' : 'hidden sm:flex'
          }`}
        >
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

        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5 sm:pt-3.5">
          <div className="min-w-0">
            <span className={`hidden ${ETIQUETA} text-[9px] text-hearth-pebble sm:block dark:text-hearth-night-pebble`}>
              Precio final
            </span>
            <span className="font-jakarta text-[15px] font-extrabold tabular-nums tracking-[-0.02em] text-hearth-espresso sm:text-lg dark:text-hearth-night-ink">
              {formatearPrecio(plato.precio)}
              <span className="ml-1 hidden text-[10px] font-semibold text-hearth-pebble sm:inline dark:text-hearth-night-pebble">
                COP
              </span>
            </span>
          </div>

          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
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
