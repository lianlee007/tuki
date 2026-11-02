import React from 'react';
import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import {
  Flame,
  Heart,
  MapPin,
  Sparkles,
  Star,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import type { PlatoDescubierto } from '../../tipos/modelos';
import { formatearPrecio } from '../../lib/utils';
import type { DireccionBaraja } from '../../hooks/useBaraja';

interface TarjetaInspiracionProps {
  plato: PlatoDescubierto;
  /** 0 es la tarjeta activa; 1 y 2 son las que esperan detrás. */
  posicion: number;
  onDecidir: (plato: PlatoDescubierto, direccion: DireccionBaraja) => void;
}

const UMBRAL = 104;
/** Curva de salida: arranca decidida y frena sin rebote. */
const CURVA_SALIDA: [number, number, number, number] = [0.23, 1, 0.32, 1];

/**
 * Una tarjeta de la baraja.
 *
 * El gesto vive en React: `x` es un MotionValue que mueve la tarjeta, inclina
 * el conjunto y revela los sellos de decisión. Al soltar, si el desplazamiento
 * o la velocidad superan el umbral, la tarjeta sale disparada; si no, el muelle
 * la devuelve al centro. La tarjeta de arriba es la única que escucha puntero y
 * teclado: las de atrás son una promesa visual, no controles.
 */
export const TarjetaInspiracion: React.FC<TarjetaInspiracionProps> = ({
  plato,
  posicion,
  onDecidir,
}) => {
  const activa = posicion === 0;
  const reducir = useReducedMotion();

  const x = useMotionValue(0);
  const rotacion = useTransform(x, [-280, 0, 280], reducir ? [0, 0, 0] : [-16, 0, 16]);
  const opacidadAntojo = useTransform(x, [18, UMBRAL], [0, 1]);
  const opacidadPasar = useTransform(x, [-UMBRAL, -18], [1, 0]);
  const escalaSello = useTransform(x, [-220, 0, 220], [1.06, 0.82, 1.06]);

  const tieneRating = plato.rating_cantidad > 0;
  const esFavoritoDeLaCasa = tieneRating && (plato.rating >= 4.7 || plato.rating_cantidad >= 50);

  const etiquetas = [
    plato.vegano ? 'Vegano' : plato.vegetariano ? 'Vegetariano' : null,
    plato.picante ? 'Picante' : null,
    plato.tipo_cocina,
    plato.categoria,
  ]
    .filter(Boolean)
    .slice(0, 3) as string[];

  const salida = (direccion: DireccionBaraja) => {
    if (reducir) {
      return { opacity: 0, transition: { duration: 0.18, ease: 'easeOut' } };
    }

    return {
      x: direccion === 'derecha' ? 760 : -760,
      y: 48,
      rotate: direccion === 'derecha' ? 24 : -24,
      opacity: 0,
      transition: { duration: 0.28, ease: CURVA_SALIDA },
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 26 }}
      animate={{
        opacity: activa ? 1 : Math.max(0.72, 1 - posicion * 0.12),
        scale: 1 - posicion * 0.045,
        // La escala encoge desde la base: hay que subir lo que se perdió
        // arriba para que el canto de la tarjeta asome sobre la activa.
        y: posicion * -32,
      }}
      exit="salida"
      variants={{ salida }}
      transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.9 }}
      style={{
        zIndex: 30 - posicion * 10,
        pointerEvents: activa ? 'auto' : 'none',
        transformOrigin: 'bottom center',
      }}
      className="absolute inset-0"
      aria-hidden={!activa}
    >
      <motion.div
        drag={activa ? 'x' : false}
        dragElastic={0.86}
        dragMomentum={false}
        dragSnapToOrigin
        dragTransition={{ bounceStiffness: 420, bounceDamping: 32 }}
        whileDrag={activa ? { cursor: 'grabbing' } : undefined}
        onDragEnd={(_evento, info) => {
          if (!activa) return;
          const impulso = info.offset.x + info.velocity.x * 0.16;
          if (impulso > UMBRAL) onDecidir(plato, 'derecha');
          else if (impulso < -UMBRAL) onDecidir(plato, 'izquierda');
        }}
        onKeyDown={(evento) => {
          if (!activa) return;
          if (evento.key === 'ArrowRight') {
            evento.preventDefault();
            onDecidir(plato, 'derecha');
          }
          if (evento.key === 'ArrowLeft') {
            evento.preventDefault();
            onDecidir(plato, 'izquierda');
          }
        }}
        tabIndex={activa ? 0 : -1}
        role="group"
        aria-label={`${plato.nombre}, de ${plato.restaurante_nombre}. Usa las flechas izquierda y derecha para decidir.`}
        className={`flex h-full w-full flex-col overflow-hidden rounded-[26px] bg-hearth-card text-left ring-1 ring-hearth-line/80 shadow-warm-lg outline-none dark:bg-hearth-night-card dark:ring-white/5 dark:shadow-warm-dark ${
          activa ? 'cursor-grab focus-visible:ring-2 focus-visible:ring-hearth-terracotta' : ''
        }`}
        style={{ x, rotate: rotacion, touchAction: 'pan-y' }}
      >
        <div className="relative h-[50%] w-full shrink-0 overflow-hidden bg-hearth-oat sm:h-[54%] dark:bg-hearth-night-oat">
          {plato.imagen_url ? (
            <img
              src={plato.imagen_url}
              alt={plato.nombre}
              loading={activa ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
              className="pointer-events-none h-full w-full select-none object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-hearth-pebble dark:text-hearth-night-pebble">
              <UtensilsCrossed size={42} aria-hidden="true" />
            </span>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-hearth-card via-transparent to-black/25 dark:from-hearth-night-card" />

          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <span className="rounded-full bg-hearth-card/95 px-3 py-1 text-[12px] font-extrabold tabular-nums text-hearth-espresso shadow-warm ring-1 ring-white/50 backdrop-blur-md dark:bg-hearth-night-card/95 dark:text-hearth-night-ink dark:ring-white/10">
              {formatearPrecio(plato.precio)}
              <span className="ml-1 text-[9px] font-bold text-hearth-pebble dark:text-hearth-night-pebble">
                COP
              </span>
            </span>

            {tieneRating && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-hearth-card/95 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-hearth-espresso shadow-warm ring-1 ring-white/50 backdrop-blur-md dark:bg-hearth-night-card/95 dark:text-hearth-night-ink dark:ring-white/10">
                <Star
                  size={12}
                  aria-hidden="true"
                  className="fill-hearth-honey text-hearth-honey dark:fill-hearth-night-terracotta dark:text-hearth-night-terracotta"
                />
                {plato.rating.toFixed(1)}
                <span className="font-semibold text-hearth-pebble dark:text-hearth-night-pebble">
                  ({plato.rating_cantidad})
                </span>
              </span>
            )}
          </div>

          {esFavoritoDeLaCasa && (
            <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-lg bg-hearth-honey/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.05em] text-[#3A2000] shadow-warm backdrop-blur-md">
              <Sparkles size={11} aria-hidden="true" />
              Favorito de la casa
            </span>
          )}

          <motion.div
            style={{ opacity: opacidadAntojo, scale: escalaSello }}
            className="pointer-events-none absolute left-4 top-16 z-20 inline-flex -rotate-12 items-center gap-1.5 rounded-xl bg-hearth-sage px-3.5 py-1.5 font-jakarta text-lg font-extrabold uppercase tracking-[0.06em] text-white shadow-lg dark:bg-hearth-night-sage-ink dark:text-hearth-night"
          >
            <Heart size={18} aria-hidden="true" className="fill-current" />
            ¡Antojo!
          </motion.div>

          <motion.div
            style={{ opacity: opacidadPasar, scale: escalaSello }}
            className="pointer-events-none absolute right-4 top-16 z-20 inline-flex rotate-12 items-center gap-1.5 rounded-xl bg-hearth-oat-deep px-3.5 py-1.5 font-jakarta text-lg font-extrabold uppercase tracking-[0.06em] text-hearth-espresso shadow-lg dark:bg-hearth-night-oat dark:text-hearth-night-ink"
          >
            <X size={18} aria-hidden="true" />
            Pasar
          </motion.div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 min-w-0 font-jakarta text-[17px] font-extrabold leading-snug tracking-[-0.02em] text-hearth-espresso sm:text-[19px] dark:text-hearth-night-ink">
              {plato.nombre}
            </h3>
          </div>

          <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[12px] font-bold text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink">
            <MapPin size={12} aria-hidden="true" className="shrink-0" />
            <span className="truncate">
              {plato.restaurante_nombre}
              {plato.ciudad ? ` · ${plato.ciudad}` : ''}
            </span>
          </p>

          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
            {plato.descripcion?.trim() ||
              `Una propuesta de ${plato.tipo_cocina || 'la casa'} lista para descubrir.`}
          </p>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {etiquetas.map((etiqueta) => {
              const esDieta = etiqueta === 'Vegano' || etiqueta === 'Vegetariano';
              const esPicante = etiqueta === 'Picante';
              return (
                <span
                  key={etiqueta}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
                    esDieta
                      ? 'bg-hearth-sage-soft text-hearth-sage-ink dark:bg-hearth-night-sage-soft dark:text-hearth-night-sage-ink'
                      : esPicante
                        ? 'bg-hearth-honey-soft text-hearth-honey-ink dark:bg-[#3A2A12] dark:text-[#F5C27A]'
                        : 'bg-hearth-oat text-hearth-pebble dark:bg-hearth-night-oat dark:text-hearth-night-pebble'
                  }`}
                >
                  {esPicante && <Flame size={10} aria-hidden="true" />}
                  {etiqueta}
                </span>
              );
            })}
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <div className="min-w-0">
              <span className="block text-[9px] font-extrabold uppercase tracking-[0.14em] text-hearth-pebble dark:text-hearth-night-pebble">
                Precio final
              </span>
              <span className="font-jakarta text-xl font-extrabold tabular-nums tracking-[-0.02em] text-hearth-espresso dark:text-hearth-night-ink">
                {formatearPrecio(plato.precio)}
                <span className="ml-1 text-[10px] font-semibold text-hearth-pebble dark:text-hearth-night-pebble">
                  COP
                </span>
              </span>
            </div>

            <span className="shrink-0 rounded-full bg-hearth-oat px-2.5 py-1 text-[10px] font-bold text-hearth-pebble dark:bg-hearth-night-oat dark:text-hearth-night-pebble">
              {activa ? 'Arrastra o usa ← →' : 'En espera'}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
