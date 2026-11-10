import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { RestauranteDescubierto } from '../../tipos/modelos';
import { TarjetaRestaurante } from './TarjetaRestaurante';
import { FOCO } from './estilos';

interface SeccionRestaurantesProps {
  restaurantes: RestauranteDescubierto[];
  total: number;
  cargando: boolean;
  /** Cocina activa en el filtro, para explicar los resultados secundarios. */
  cocinaCoincidente?: string | null;
  /** Abre la lista completa sin bajar el feed. */
  onVerTodos: () => void;
}

/**
 * Los restaurantes, antes del feed.
 *
 * En móvil se ven dos perfiles —el resto espera en la hoja de «Ver todos»— para
 * que la portada no gaste cuatro pantallas en locales antes de enseñar comida.
 * Desde tablet caben tres. La foto, el logo y los platos bastan para decidir si
 * entrar; la ficha completa vive en el menú.
 */
export const SeccionRestaurantes: React.FC<SeccionRestaurantesProps> = ({
  restaurantes,
  total,
  cargando,
  cocinaCoincidente,
  onVerTodos,
}) => {
  if (!cargando && restaurantes.length === 0) return null;

  const esqueleto = (indice: number) => (
    <div
      key={`esqueleto-${indice}`}
      aria-hidden="true"
      className={`overflow-hidden rounded-[22px] bg-hearth-card ring-1 ring-hearth-line/60 dark:bg-hearth-night-card dark:ring-white/5 ${
        indice >= 2 ? 'hidden sm:block' : ''
      }`}
    >
      <div className="aspect-[16/9] bg-hearth-oat dark:bg-hearth-night-oat" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
        <div className="h-2.5 w-1/2 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
      </div>
    </div>
  );

  return (
    <section aria-labelledby="titulo-restaurantes">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="titulo-restaurantes"
            className="font-jakarta text-[20px] font-extrabold tracking-[-0.03em] text-hearth-espresso dark:text-hearth-night-ink"
          >
            Restaurantes
          </h2>
          <p className="mt-0.5 truncate text-[12.5px] text-hearth-pebble dark:text-hearth-night-pebble">
            {cargando
              ? 'Buscando restaurantes cerca de ti…'
              : total === 1
                ? 'Un restaurante para entrar'
                : `${total.toLocaleString('es-CO')} restaurantes para entrar`}
          </p>
        </div>

        {!cargando && total > 2 && (
          <button
            type="button"
            onClick={onVerTodos}
            className={`af-pulsar inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full px-3 py-2 text-[12px] font-bold text-hearth-terracotta-ink transition-colors hover:bg-hearth-terracotta-soft dark:text-hearth-night-terracotta-ink dark:hover:bg-hearth-night-terracotta-soft ${FOCO}`}
          >
            Ver todos
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {cargando && restaurantes.length === 0
          ? Array.from({ length: 3 }).map((_, indice) => esqueleto(indice))
          : restaurantes.map((restaurante, indice) => (
              <div
                key={restaurante.id}
                className={
                  restaurantes.length === 1
                    ? 'col-span-2 sm:col-span-1'
                    : indice >= 3
                      ? 'hidden'
                      : indice === 2
                        ? 'hidden sm:block'
                        : ''
                }
              >
                <TarjetaRestaurante
                  restaurante={restaurante}
                  cocinaCoincidente={cocinaCoincidente}
                  prioridad={indice < 3}
                />
              </div>
            ))}
      </div>
    </section>
  );
};
