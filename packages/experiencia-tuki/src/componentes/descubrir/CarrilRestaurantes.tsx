import React from 'react';
import type { RestauranteDescubierto } from '../../tipos/modelos';
import { TarjetaRestaurante } from './TarjetaRestaurante';

interface CarrilRestaurantesProps {
  restaurantes: RestauranteDescubierto[];
  total: number;
  cargando: boolean;
  /** Cocina activa en el filtro, para explicar los resultados secundarios. */
  cocinaCoincidente?: string | null;
}

/**
 * Los restaurantes aliados.
 *
 * Van antes del feed porque son una puerta distinta —entrar al menú completo—
 * y conviene decidirla con la foto del local. En móvil son una tira horizontal:
 * el siguiente local asoma por el borde y se recorren con el pulgar sin gastar
 * siete pantallas de alto. En escritorio se quedan en la misma tira, con cartas
 * más anchas, para no empujar los platos hacia abajo.
 */
export const CarrilRestaurantes: React.FC<CarrilRestaurantesProps> = ({
  restaurantes,
  total,
  cargando,
  cocinaCoincidente,
}) => {
  if (!cargando && restaurantes.length === 0) return null;

  const ancho = 'w-[248px] shrink-0 snap-start sm:w-[272px]';

  return (
    <section aria-labelledby="titulo-restaurantes">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="titulo-restaurantes"
            className="font-jakarta text-[16px] font-extrabold tracking-[-0.02em] text-hearth-espresso dark:text-hearth-night-ink"
          >
            Restaurantes aliados
          </h2>
          <p className="mt-0.5 truncate text-[12px] text-hearth-pebble dark:text-hearth-night-pebble">
            {cargando
              ? 'Buscando cocinas cerca de ti…'
              : total === 1
                ? '1 restaurante para entrar'
                : `${total.toLocaleString('es-CO')} restaurantes para entrar`}
          </p>
        </div>

        <span className="hidden shrink-0 text-[12px] font-semibold text-hearth-pebble sm:block dark:text-hearth-night-pebble">
          Precios de carta, sin recargos
        </span>
      </div>

      <div className="relative">
        <div
          className="af-sin-scrollbar -mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 sm:-mx-6 sm:gap-4 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:px-0"
          aria-busy={cargando}
        >
          {cargando && restaurantes.length === 0
            ? Array.from({ length: 3 }).map((_, indice) => (
                <div key={`esqueleto-${indice}`} className={ancho} aria-hidden="true">
                  <div className="overflow-hidden rounded-3xl bg-hearth-card ring-1 ring-hearth-line/60 dark:bg-hearth-night-card dark:ring-white/5">
                    <div className="aspect-[16/10] animate-pulse bg-hearth-oat dark:bg-hearth-night-oat" />
                    <div className="flex items-center justify-between gap-3 p-4">
                      <div className="w-2/3 space-y-2">
                        <div className="h-3 w-1/2 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
                        <div className="h-2.5 w-3/4 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
                      </div>
                      <div className="h-8 w-20 rounded-xl bg-hearth-oat dark:bg-hearth-night-oat" />
                    </div>
                  </div>
                </div>
              ))
            : restaurantes.map((restaurante, indice) => (
                <div key={restaurante.id} className={ancho}>
                  <TarjetaRestaurante
                    restaurante={restaurante}
                    cocinaCoincidente={cocinaCoincidente}
                    prioridad={indice < 3}
                  />
                </div>
              ))}
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -right-4 w-10 bg-gradient-to-l from-hearth-cream via-hearth-cream/70 to-transparent sm:-right-6 lg:right-0 dark:from-hearth-night dark:via-hearth-night/70"
        />
      </div>
    </section>
  );
};
