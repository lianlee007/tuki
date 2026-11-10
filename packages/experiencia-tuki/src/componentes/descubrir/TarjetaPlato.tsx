import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, Plus, Sparkles, Star, UtensilsCrossed } from 'lucide-react';
import type { PlatoDescubierto } from '../../tipos/modelos';
import { formatearPrecio, generarSlug } from '../../lib/utils';
import { AvatarRestaurante } from './AvatarRestaurante';
import {
  BOTON_PRIMARIO,
  BOTON_SUAVE,
  FOCO,
  FOCO_IMAGEN,
  INSIGNIA_CALIDA,
  INSIGNIA_FRESCA,
} from './estilos';

interface TarjetaPlatoProps {
  plato: PlatoDescubierto;
  /** El primero del feed se presenta como la sugerencia de hoy. */
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

const EtiquetasDieta: React.FC<{ dietas: string[]; className?: string }> = ({
  dietas,
  className = '',
}) => (
  <span className={`flex flex-wrap items-center gap-1.5 ${className}`}>
    {dietas.map((dieta) => (
      <span
        key={dieta}
        className={`${dieta === 'Picante' ? INSIGNIA_CALIDA : INSIGNIA_FRESCA} shadow-warm backdrop-blur-sm`}
      >
        {dieta}
      </span>
    ))}
  </span>
);

/**
 * Una publicación del feed.
 *
 * El primer plato se cuenta como una publicación social: quién lo cocina,
 * dónde, qué es y cuánto cuesta, en ese orden. El resto vive en una cuadrícula
 * de dos columnas que en móvil se queda con la foto, el nombre, el restaurante
 * y el precio; la descripción y la cocina aparecen desde tablet. El botón de
 * añadir salta encima de la foto para que el pulgar no tenga que buscar una
 * fila extra.
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
  const metaRestaurante = [plato.tipo_cocina, plato.ciudad].filter(Boolean).join(' · ');
  const descripcion =
    plato.descripcion?.trim() ||
    `${plato.tipo_cocina || 'Cocina de la casa'}${plato.ciudad ? ` en ${plato.ciudad}` : ''}.`;

  const botonFavorito = (clase: string) =>
    onFavorito && (
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
        className={`af-pulsar pointer-events-auto flex shrink-0 items-center justify-center rounded-full bg-hearth-card/95 shadow-warm ring-1 ring-white/60 transition-colors hover:scale-105 dark:bg-hearth-night-card/95 dark:ring-white/10 ${FOCO} ${
          esFavorito
            ? 'text-hearth-terracotta-ink dark:text-hearth-night-terracotta'
            : 'text-hearth-pebble dark:text-hearth-night-pebble'
        } ${clase}`}
      >
        <Heart size={16} aria-hidden="true" className={esFavorito ? 'fill-current' : undefined} />
      </button>
    );

  if (destacado) {
    return (
      <article className="group col-span-2 flex h-full flex-col overflow-hidden rounded-[26px] bg-hearth-card ring-1 ring-hearth-line/60 shadow-warm transition-shadow hover:shadow-warm-lg sm:min-h-[280px] sm:flex-row dark:bg-hearth-night-card dark:ring-white/5 dark:shadow-none dark:hover:shadow-warm-dark">
        <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-hearth-oat dark:bg-hearth-night-oat sm:aspect-auto sm:w-[52%]">
          <Link
            to={destino}
            aria-label={`Ver el menú de ${plato.restaurante_nombre}`}
            className={`absolute inset-0 block ${FOCO_IMAGEN}`}
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center text-hearth-line dark:text-hearth-night-line"
            >
              <UtensilsCrossed size={34} />
            </span>

            {plato.imagen_url && (
              <img
                src={plato.imagen_url}
                alt={plato.nombre}
                loading={prioridad ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={prioridad ? 'high' : undefined}
                className="relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            )}

            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2B1712]/55 via-transparent to-transparent"
            />

            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-hearth-honey px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#3A2000] shadow-warm">
              <Sparkles size={11} aria-hidden="true" />
              Sugerido para ti
            </span>
          </Link>
        </div>

        <div className="flex min-w-0 flex-1 flex-col px-4 pb-4 pt-3.5 sm:px-5 sm:py-5">
          <div className="flex items-center gap-2.5">
            <AvatarRestaurante nombre={plato.restaurante_nombre} tamano={34} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-extrabold tracking-[-0.01em] text-hearth-espresso dark:text-hearth-night-ink">
                {plato.restaurante_nombre}
              </p>
              <p className="truncate text-[11px] text-hearth-pebble dark:text-hearth-night-pebble">
                {metaRestaurante || 'Cocina de la casa'}
              </p>
            </div>

            {botonFavorito('h-10 w-10')}
          </div>

          <div className="mt-3">
            <h3 className="text-balance font-jakarta text-[19px] font-extrabold leading-tight tracking-[-0.025em] text-hearth-espresso sm:text-[21px] dark:text-hearth-night-ink">
              <Link
                to={destino}
                className={`rounded transition-colors hover:text-hearth-terracotta-ink dark:hover:text-hearth-night-terracotta ${FOCO}`}
              >
                {plato.nombre}
              </Link>
            </h3>
            <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-hearth-pebble sm:text-[13px] dark:text-hearth-night-pebble">
              {descripcion}
            </p>
          </div>

          {dietas.length > 0 && (
            <div className="mt-3">
              <EtiquetasDieta dietas={dietas} />
            </div>
          )}

          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <span className="font-jakarta text-[19px] font-extrabold tabular-nums tracking-[-0.025em] text-hearth-espresso sm:text-[20px] dark:text-hearth-night-ink">
              {formatearPrecio(plato.precio)}
            </span>

            <div className="flex shrink-0 items-center gap-1.5">
              {onVerDetalle && (
                <button
                  type="button"
                  onClick={() => onVerDetalle(plato)}
                  aria-label={`Ver el detalle de ${plato.nombre}`}
                  className={`${BOTON_SUAVE} h-10 px-2.5 text-[12px]`}
                >
                  <ArrowUpRight size={14} aria-hidden="true" />
                  Detalle
                </button>
              )}

              {onAgregar && (
                <button
                  type="button"
                  onClick={() => onAgregar(plato)}
                  aria-label={`Añadir ${plato.nombre} al carrito`}
                  className={`${BOTON_PRIMARIO} h-10 px-3 text-[12px]`}
                >
                  <Plus size={15} strokeWidth={2.6} aria-hidden="true" />
                  Añadir
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-[22px] bg-hearth-card p-2 ring-1 ring-hearth-line/60 shadow-warm transition-shadow hover:shadow-warm-lg dark:bg-hearth-night-card dark:ring-white/5 dark:shadow-none dark:hover:shadow-warm-dark sm:rounded-3xl sm:p-2.5"
    >
      <div className="relative aspect-square overflow-hidden rounded-[17px] bg-hearth-oat dark:bg-hearth-night-oat sm:aspect-[4/3]">
        <Link
          to={destino}
          aria-label={`Ver el menú de ${plato.restaurante_nombre}`}
          className={`block h-full w-full ${FOCO_IMAGEN}`}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-hearth-line dark:text-hearth-night-line"
          >
            <UtensilsCrossed size={26} />
          </span>

          {plato.imagen_url && (
            <img
              src={plato.imagen_url}
              alt={plato.nombre}
              loading={prioridad ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={prioridad ? 'high' : undefined}
              className="relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute right-2 top-2">
          {botonFavorito('h-10 w-10')}
        </div>

        <div className="pointer-events-none absolute inset-x-2 bottom-2 hidden items-end justify-between gap-2 sm:flex">
          {dietas.length > 0 ? <EtiquetasDieta dietas={dietas} /> : <span />}

          {tieneRating && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[10px] font-bold tabular-nums text-white ring-1 ring-white/20 backdrop-blur-md">
              <Star size={10} aria-hidden="true" className="fill-current text-[#FFD79A]" />
              {plato.rating.toFixed(1)}
            </span>
          )}
        </div>

        {onAgregar && (
          <button
            type="button"
            onClick={() => onAgregar(plato)}
            aria-label={`Añadir ${plato.nombre} al carrito`}
            className={`af-pulsar pointer-events-auto absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-hearth-terracotta-deep text-white shadow-warm transition-colors hover:bg-hearth-terracotta-ink sm:hidden ${FOCO}`}
          >
            <Plus size={17} strokeWidth={2.6} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-2.5 sm:px-1.5 sm:pb-1.5 sm:pt-3">
        <h3 className="line-clamp-2 text-[13.5px] font-bold leading-snug tracking-[-0.01em] text-hearth-espresso sm:text-[16px] dark:text-hearth-night-ink">
          <Link
            to={destino}
            className={`rounded transition-colors hover:text-hearth-terracotta-ink dark:hover:text-hearth-night-terracotta ${FOCO}`}
          >
            {plato.nombre}
          </Link>
        </h3>

        <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
          <AvatarRestaurante nombre={plato.restaurante_nombre} tamano={16} />
          <p className="truncate text-[10.5px] font-semibold text-hearth-terracotta-ink sm:text-[11.5px] dark:text-hearth-night-terracotta-ink">
            {plato.restaurante_nombre}
          </p>
        </div>

        <p className="mt-1.5 hidden line-clamp-2 text-[12.5px] leading-relaxed text-hearth-pebble sm:block dark:text-hearth-night-pebble">
          {descripcion}
        </p>

        <div className="mt-1.5 hidden flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-hearth-pebble sm:flex dark:text-hearth-night-pebble">
          {plato.tipo_cocina && <span className="truncate">{plato.tipo_cocina}</span>}
          {plato.ciudad && (
            <>
              <span aria-hidden="true" className="text-hearth-line dark:text-hearth-night-line">
                ·
              </span>
              <span className="truncate">{plato.ciudad}</span>
            </>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <span className="font-jakarta text-[14.5px] font-extrabold tabular-nums tracking-[-0.02em] text-hearth-espresso sm:text-lg dark:text-hearth-night-ink">
            {formatearPrecio(plato.precio)}
          </span>

          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            {onVerDetalle && (
              <button
                type="button"
                onClick={() => onVerDetalle(plato)}
                aria-label={`Ver el detalle de ${plato.nombre}`}
                className={`${BOTON_SUAVE} h-10 px-2.5 text-[12px]`}
              >
                <ArrowUpRight size={14} aria-hidden="true" />
                Detalle
              </button>
            )}

            {onAgregar && (
              <button
                type="button"
                onClick={() => onAgregar(plato)}
                aria-label={`Añadir ${plato.nombre} al carrito`}
                className={`${BOTON_PRIMARIO} h-10 px-2.5 text-[12px]`}
              >
                <Plus size={15} strokeWidth={2.6} aria-hidden="true" />
                Añadir
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
