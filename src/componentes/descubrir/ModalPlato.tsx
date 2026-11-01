import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Plus, Star, UtensilsCrossed, X } from 'lucide-react';
import type { PlatoDescubierto } from '../../tipos/modelos';
import { formatearPrecio, generarSlug } from '../../lib/utils';
import { Hoja } from './Hoja';
import {
  BOTON_PRIMARIO,
  BOTON_SUAVE,
  ETIQUETA,
  FOCO,
  INSIGNIA_CALIDA,
  INSIGNIA_FRESCA,
} from './estilos';

interface ModalPlatoProps {
  plato: PlatoDescubierto | null;
  onCerrar: () => void;
  esFavorito?: boolean;
  onFavorito?: (plato: PlatoDescubierto) => void;
  onAgregar?: (plato: PlatoDescubierto) => void;
}

/**
 * La ficha rápida de un plato.
 *
 * Sirve para decidir sin perder el feed: se abre encima de la portada, muestra
 * lo que la tarjeta no cabe (descripción completa, restaurante, dietas) y deja
 * pedir en el mismo gesto. El enlace al menú completo sigue disponible.
 */
export const ModalPlato: React.FC<ModalPlatoProps> = ({
  plato,
  onCerrar,
  esFavorito = false,
  onFavorito,
  onAgregar,
}) => {
  if (!plato) return null;

  const dietas = [
    plato.vegano ? 'Vegano' : plato.vegetariano ? 'Vegetariano' : null,
    plato.picante ? 'Picante' : null,
  ].filter(Boolean) as string[];
  const destino = `/restaurante/${generarSlug(plato.restaurante_nombre)}?plato=${plato.id}`;

  return (
    <Hoja abierto={plato !== null} onCerrar={onCerrar} tituloId="titulo-ficha-plato" ancho="lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`${ETIQUETA} text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink`}>
            Ficha del plato
          </p>
          <h2
            id="titulo-ficha-plato"
            className="mt-1 font-jakarta text-xl font-extrabold leading-snug tracking-[-0.02em] text-hearth-espresso dark:text-hearth-night-ink"
          >
            {plato.nombre}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {onFavorito && (
            <button
              type="button"
              onClick={() => onFavorito(plato)}
              aria-pressed={esFavorito}
              aria-label={esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              className={`af-pulsar flex h-9 w-9 items-center justify-center rounded-xl bg-hearth-oat transition-colors hover:text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:hover:text-hearth-night-terracotta ${FOCO} ${
                esFavorito
                  ? 'text-hearth-terracotta-ink dark:text-hearth-night-terracotta'
                  : 'text-hearth-pebble dark:text-hearth-night-pebble'
              }`}
            >
              <Heart size={17} aria-hidden="true" className={esFavorito ? 'fill-current' : undefined} />
            </button>
          )}
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar la ficha"
            className={`af-pulsar flex h-9 w-9 items-center justify-center rounded-xl bg-hearth-oat text-hearth-pebble transition-colors hover:text-hearth-espresso dark:bg-hearth-night-oat dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink ${FOCO}`}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-4 h-52 overflow-hidden rounded-2xl bg-hearth-oat sm:h-60 dark:bg-hearth-night-oat">
        {plato.imagen_url ? (
          <img
            src={plato.imagen_url}
            alt={plato.nombre}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-hearth-pebble dark:text-hearth-night-pebble">
            <UtensilsCrossed size={32} aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <Link
          to={destino}
          className="inline-flex items-center gap-1.5 rounded-xl bg-hearth-oat px-3 py-1.5 text-[11px] font-bold text-hearth-espresso transition-colors hover:text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:hover:text-hearth-night-terracotta"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-hearth-terracotta dark:bg-hearth-night-terracotta" />
          {plato.restaurante_nombre}
        </Link>

        {plato.rating_cantidad > 0 && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-hearth-honey-soft px-2.5 py-1.5 text-[11px] font-extrabold tabular-nums text-hearth-honey-ink dark:bg-hearth-night-honey-soft dark:text-hearth-night-honey-ink">
            <Star size={12} aria-hidden="true" className="fill-current" />
            {plato.rating.toFixed(1)} · {plato.rating_cantidad}
          </span>
        )}

        {dietas.map((dieta) => (
          <span key={dieta} className={dieta === 'Picante' ? INSIGNIA_CALIDA : INSIGNIA_FRESCA}>
            {dieta}
          </span>
        ))}
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
        {plato.descripcion?.trim() ||
          'El restaurante todavía no ha escrito la descripción de este plato. Puedes verlo completo en su menú.'}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
        <div className="rounded-xl bg-hearth-oat/70 p-3 dark:bg-hearth-night-oat/70">
          <dt className={`${ETIQUETA} text-[9px] text-hearth-pebble dark:text-hearth-night-pebble`}>
            Cocina
          </dt>
          <dd className="mt-0.5 font-bold text-hearth-espresso dark:text-hearth-night-ink">
            {plato.tipo_cocina || 'De la casa'}
          </dd>
        </div>
        <div className="rounded-xl bg-hearth-oat/70 p-3 dark:bg-hearth-night-oat/70">
          <dt className={`${ETIQUETA} text-[9px] text-hearth-pebble dark:text-hearth-night-pebble`}>
            Ciudad
          </dt>
          <dd className="mt-0.5 font-bold text-hearth-espresso dark:text-hearth-night-ink">
            {plato.ciudad || 'Sin dato'}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-hearth-line/70 pt-4 dark:border-hearth-night-line">
        <div>
          <span className={`block ${ETIQUETA} text-[9px] text-hearth-pebble dark:text-hearth-night-pebble`}>
            Precio final
          </span>
          <span className="font-jakarta text-xl font-extrabold tabular-nums tracking-[-0.02em] text-hearth-espresso dark:text-hearth-night-ink">
            {formatearPrecio(plato.precio)}
          </span>
          <span className="ml-1 text-[10px] font-semibold text-hearth-pebble dark:text-hearth-night-pebble">
            COP
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link to={destino} className={`${BOTON_SUAVE} text-[13px]`}>
            Ver menú
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          {onAgregar && (
            <button
              type="button"
              onClick={() => onAgregar(plato)}
              className={`${BOTON_PRIMARIO} text-[13px]`}
            >
              <Plus size={16} strokeWidth={2.6} aria-hidden="true" />
              Añadir
            </button>
          )}
        </div>
      </div>
    </Hoja>
  );
};
