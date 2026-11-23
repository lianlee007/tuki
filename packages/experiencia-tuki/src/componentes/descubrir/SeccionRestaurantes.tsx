import React from 'react';
import { Store } from 'lucide-react';
import type { RestauranteDescubierto } from '../../tipos/modelos';
import { TarjetaRestaurante } from './TarjetaRestaurante';

interface SeccionRestaurantesProps {
  restaurantes: RestauranteDescubierto[];
  total: number;
  cargando: boolean;
  /** Cocina activa en el filtro, para explicar los resultados secundarios. */
  cocinaCoincidente?: string | null;
}

/**
 * Los restaurantes, antes del feed.
 *
 * La lista completa vive aquí: nada de hojas ni ventanas para elegir local.
 * En móvil caben dos por fila y el resto sigue bajando con la página; desde
 * tablet caben tres. La foto, el logo y los platos bastan para decidir si
 * entrar; la ficha completa vive en el menú.
 */
export const SeccionRestaurantes: React.FC<SeccionRestaurantesProps> = ({
  restaurantes,
  total,
  cargando,
  cocinaCoincidente,
}) => {
  if (!cargando && restaurantes.length === 0) return null;

  const esqueleto = (indice: number) => (
    <div
      key={`esqueleto-${indice}`}
      aria-hidden="true"
      className="overflow-hidden rounded-[22px] bg-hearth-card ring-1 ring-hearth-line/60 dark:bg-hearth-night-card dark:ring-white/5"
    >
      <div className="aspect-[16/9] bg-hearth-oat dark:bg-hearth-night-oat" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
        <div className="h-2.5 w-1/2 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
      </div>
    </div>
  );

  return (
    <section id="restaurantes" aria-labelledby="titulo-restaurantes" className="scroll-mt-28">
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
              ? 'Buscando restaurantes cerca de ti.'
              : total === 1
                ? 'Un restaurante · toca para ver su menú'
                : `${total.toLocaleString('es-CO')} restaurantes · toca uno para ver su menú`}
          </p>
        </div>

        {!cargando && total > 0 && (
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-hearth-oat px-3 py-1.5 text-[11px] font-bold text-hearth-pebble sm:inline-flex dark:bg-hearth-night-oat dark:text-hearth-night-pebble">
            <Store size={13} aria-hidden="true" />
            Elige tu local
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {cargando && restaurantes.length === 0
          ? Array.from({ length: 3 }).map((_, indice) => esqueleto(indice))
          : restaurantes.map((restaurante, indice) => (
              <div
                key={restaurante.id}
                className={restaurantes.length === 1 ? 'col-span-2 sm:col-span-1' : ''}
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
