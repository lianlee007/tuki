import React, { useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { Flame, Heart, MapPin, Sparkles, Star, UtensilsCrossed, X } from 'lucide-react';
import type { PlatoDescubierto } from '../../tipos/modelos';
import { formatearPrecio } from '../../lib/utils';
import type { DireccionBaraja } from '../../hooks/useBaraja';
import { AvatarRestaurante } from '../descubrir/AvatarRestaurante';

interface TarjetaInspiracionProps {
  plato: PlatoDescubierto;
  /** 0 es la tarjeta activa; 1 y 2 son las que esperan detrás. */
  posicion: number;
  /** Avisa del primer contacto para retirar la pista de gestos. */
  onInteractuar?: () => void;
  onDecidir: (plato: PlatoDescubierto, direccion: DireccionBaraja) => void;
}

/**
 * Umbral de decisión. Se mide en proporción al ancho de la tarjeta (un tercio)
 * y se completa con la velocidad del gesto, para que un tirón corto también
 * cuente y un arrastre lento no se dispare por accidente.
 */
const UMBRAL_RELATIVO = 0.3;
const VELOCIDAD_MINIMA = 620;
/** Curva de salida: arranca decidida y frena sin rebote. */
const CURVA_SALIDA: [number, number, number, number] = [0.23, 1, 0.32, 1];

/**
 * Una tarjeta de la baraja.
 *
 * El gesto vive en React: `x` mueve la tarjeta, inclina el conjunto y revela
 * los sellos de decisión. Al soltar, si el desplazamiento o la velocidad
 * superan el umbral, la tarjeta sale disparada; si no, el muelle la devuelve al
 * centro. La tarjeta de arriba es la única que escucha puntero y teclado.
 *
 * La foto no lleva velo blanco: el degradado cálido anterior se comía la mitad
 * inferior de cada plato y parecía que la imagen se borraba al deslizar. Los
 * datos ahora viven en una franja propia y la foto se ve entera.
 */
export const TarjetaInspiracion: React.FC<TarjetaInspiracionProps> = ({
  plato,
  posicion,
  onInteractuar,
  onDecidir,
}) => {
  const activa = posicion === 0;
  const reducir = useReducedMotion();
  const [imagenRota, setImagenRota] = useState(false);

  const x = useMotionValue(0);
  const rotacion = useTransform(x, [-280, 0, 280], reducir ? [0, 0, 0] : [-14, 0, 14]);
  const opacidadAntojo = useTransform(x, [18, 116], [0, 1]);
  const opacidadPasar = useTransform(x, [-116, -18], [1, 0]);
  const escalaSello = useTransform(x, [-220, 0, 220], [1.04, 0.84, 1.04]);

  const tieneRating = plato.rating_cantidad > 0;
  const esFavoritoDeLaCasa = tieneRating && (plato.rating >= 4.7 || plato.rating_cantidad >= 50);

  const etiquetaPrincipal = plato.vegano
    ? 'Vegano'
    : plato.vegetariano
      ? 'Vegetariano'
      : plato.picante
        ? 'Picante'
        : plato.tipo_cocina;
  const etiquetaEsDieta = etiquetaPrincipal === 'Vegano' || etiquetaPrincipal === 'Vegetariano';
  const etiquetaEsPicante = etiquetaPrincipal === 'Picante';

  const salida = (direccion: DireccionBaraja) => {
    if (reducir) {
      return { opacity: 0, transition: { duration: 0.18, ease: 'easeOut' } };
    }

    // Sin opacidad: la tarjeta sale entera de la pantalla. Desvanecerla sobre
    // la tarjeta blanca de atrás era justo el flash que parecía un borrado.
    return {
      x: direccion === 'derecha' ? 960 : -960,
      y: 0,
      rotate: direccion === 'derecha' ? 22 : -22,
      transition: { duration: 0.3, ease: CURVA_SALIDA },
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{
        // Sin fundido al subir de puesto: una tarjeta semitransparente deja
        // ver el texto de la que está detrás y parece que la foto se borra.
        opacity: 1,
        scale: 1 - posicion * 0.045,
        // La escala encoge desde la base: hay que subir lo que se perdió
        // arriba para que el canto de la tarjeta asome sobre la activa.
        y: posicion * -30,
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
        dragElastic={0.7}
        dragMomentum={false}
        dragSnapToOrigin
        dragTransition={{ bounceStiffness: 420, bounceDamping: 32 }}
        whileDrag={activa ? { cursor: 'grabbing' } : undefined}
        onDragStart={() => {
          if (activa) onInteractuar?.();
        }}
        onDragEnd={(evento, info) => {
          if (!activa) return;
          const recorrido = info.offset.x;
          const velocidad = info.velocity.x;
          const ancho = (evento.currentTarget as HTMLElement | null)?.offsetWidth || 320;
          const umbral = ancho * UMBRAL_RELATIVO;

          if (recorrido > umbral || velocidad > VELOCIDAD_MINIMA) {
            onDecidir(plato, 'derecha');
          } else if (recorrido < -umbral || velocidad < -VELOCIDAD_MINIMA) {
            onDecidir(plato, 'izquierda');
          }
        }}
        onKeyDown={(evento) => {
          if (!activa) return;
          if (evento.key === 'ArrowRight') {
            evento.preventDefault();
            onInteractuar?.();
            onDecidir(plato, 'derecha');
          }
          if (evento.key === 'ArrowLeft') {
            evento.preventDefault();
            onInteractuar?.();
            onDecidir(plato, 'izquierda');
          }
        }}
        tabIndex={activa ? 0 : -1}
        role="group"
        aria-label={`${plato.nombre}, de ${plato.restaurante_nombre}. Desliza a la derecha para guardarlo o a la izquierda para pasar.`}
        className={`flex h-full w-full flex-col overflow-hidden rounded-[26px] bg-hearth-card text-left ring-1 ring-hearth-line/80 shadow-warm-lg outline-none dark:bg-hearth-night-card dark:ring-white/5 dark:shadow-warm-dark ${
          activa
            ? 'cursor-grab focus-visible:ring-2 focus-visible:ring-hearth-terracotta dark:focus-visible:ring-hearth-night-terracotta'
            : ''
        }`}
        style={{ x, rotate: rotacion, touchAction: 'pan-y' }}
      >
        <div className="relative h-[60%] w-full shrink-0 overflow-hidden bg-hearth-oat sm:h-[56%] dark:bg-hearth-night-oat">
          {plato.imagen_url && !imagenRota ? (
            <img
              src={plato.imagen_url}
              alt={plato.nombre}
              loading="eager"
              decoding="async"
              draggable={false}
              onError={() => setImagenRota(true)}
              className="pointer-events-none h-full w-full select-none object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-hearth-line dark:text-hearth-night-line">
              <UtensilsCrossed size={40} aria-hidden="true" />
            </span>
          )}

          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-end gap-2">
            {tieneRating && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-hearth-card/95 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-hearth-espresso shadow-warm ring-1 ring-white/50 dark:bg-hearth-night-card/95 dark:text-hearth-night-ink dark:ring-white/10">
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
            <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-lg bg-hearth-honey/95 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.02em] text-[#3A2000] shadow-warm">
              <Sparkles size={11} aria-hidden="true" />
              Favorito de la casa
            </span>
          )}

          <motion.div
            style={{ opacity: opacidadAntojo, scale: escalaSello }}
            className="pointer-events-none absolute left-4 top-16 z-20 inline-flex -rotate-12 items-center gap-1.5 rounded-xl bg-hearth-sage px-3.5 py-1.5 font-jakarta text-lg font-extrabold tracking-[0.04em] text-white shadow-lg dark:bg-hearth-night-sage-ink dark:text-hearth-night"
          >
            <Heart size={18} aria-hidden="true" className="fill-current" />
            ¡Antojo!
          </motion.div>

          <motion.div
            style={{ opacity: opacidadPasar, scale: escalaSello }}
            className="pointer-events-none absolute right-4 top-16 z-20 inline-flex rotate-12 items-center gap-1.5 rounded-xl bg-hearth-oat-deep px-3.5 py-1.5 font-jakarta text-lg font-extrabold tracking-[0.04em] text-hearth-espresso shadow-lg dark:bg-hearth-night-oat dark:text-hearth-night-ink"
          >
            <X size={18} aria-hidden="true" />
            Pasar
          </motion.div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-5">
          <div className="flex min-w-0 items-center gap-2">
            <AvatarRestaurante nombre={plato.restaurante_nombre} tamano={26} />
            <p className="min-w-0 flex-1 truncate text-[11.5px] font-bold text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink">
              {plato.restaurante_nombre}
            </p>
            {plato.ciudad && (
              <p className="flex min-w-0 shrink-0 items-center gap-0.5 text-[10.5px] font-semibold text-hearth-pebble dark:text-hearth-night-pebble">
                <MapPin size={10} aria-hidden="true" className="shrink-0" />
                <span className="max-w-[9rem] truncate">{plato.ciudad}</span>
              </p>
            )}
          </div>

          <h3 className="mt-1.5 line-clamp-2 font-jakarta text-[18px] font-extrabold leading-[1.15] tracking-[-0.025em] text-hearth-espresso sm:text-[20px] dark:text-hearth-night-ink">
            {plato.nombre}
          </h3>

          <div className="hidden [@media(min-width:381px)_and_(min-height:760px)]:block">
            <p className="mt-1 line-clamp-1 text-[12px] leading-relaxed text-hearth-pebble sm:line-clamp-2 sm:text-[12.5px] dark:text-hearth-night-pebble">
              {plato.descripcion?.trim() ||
                `Una propuesta de ${plato.tipo_cocina || 'la casa'} lista para descubrir.`}
            </p>
          </div>

          <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
            <span className="font-jakarta text-[19px] font-extrabold tabular-nums leading-none tracking-[-0.02em] text-hearth-espresso sm:text-[21px] dark:text-hearth-night-ink">
              {formatearPrecio(plato.precio)}
              <span className="ml-1 text-[9.5px] font-bold text-hearth-pebble dark:text-hearth-night-pebble">
                COP
              </span>
            </span>

            {etiquetaPrincipal && (
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
                  etiquetaEsDieta
                    ? 'bg-hearth-sage-soft text-hearth-sage-ink dark:bg-hearth-night-sage-soft dark:text-hearth-night-sage-ink'
                    : etiquetaEsPicante
                      ? 'bg-hearth-honey-soft text-hearth-honey-ink dark:bg-[#3A2A12] dark:text-[#F5C27A]'
                      : 'bg-hearth-oat text-hearth-pebble dark:bg-hearth-night-oat dark:text-hearth-night-pebble'
                }`}
              >
                {etiquetaEsPicante && <Flame size={10} aria-hidden="true" />}
                {etiquetaPrincipal}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
