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
 * El carril de restaurantes.
 *
 * Va debajo de las cocinas y por encima del feed: responde al mismo buscador y
 * a la misma cocina, pero es una puerta distinta —entrar a un menú— y por eso
 * no compite con la retícula de platos. En móvil se recorre con el pulgar; en
 * escritorio cabe casi entero y lo que sobra se arrastra.
 */
export const CarrilRestaurantes: React.FC<CarrilRestaurantesProps> = ({
  restaurantes,
  total,
  cargando,
  cocinaCoincidente,
}) => {
  if (!cargando && restaurantes.length === 0) return null;

  return (
    <section className="mt-7" aria-labelledby="titulo-restaurantes">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="titulo-restaurantes"
          className="text-[15px] font-semibold tracking-tight text-af-ink"
        >
          Restaurantes
        </h2>
        {!cargando && (
          <p aria-live="polite" className="text-[12px] text-af-ink-secondary">
            {total === 1 ? '1 restaurante' : `${total.toLocaleString('es-CO')} restaurantes`}
          </p>
        )}
      </div>

      <ul
        className="-mx-5 mt-3 flex snap-x gap-4 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-busy={cargando}
      >
        {cargando && restaurantes.length === 0
          ? Array.from({ length: 3 }).map((_, indice) => (
              <li
                key={`esqueleto-${indice}`}
                className="w-[232px] shrink-0"
                aria-hidden="true"
              >
                <div className="aspect-[16/10] rounded-[18px] bg-af-surface" />
                <div className="mt-3 h-4 w-2/3 rounded-full bg-af-surface" />
                <div className="mt-2 h-3 w-1/2 rounded-full bg-af-surface" />
              </li>
            ))
          : restaurantes.map((restaurante) => (
              <li key={restaurante.id} className="w-[232px] shrink-0 snap-start">
                <TarjetaRestaurante
                  restaurante={restaurante}
                  cocinaCoincidente={cocinaCoincidente}
                />
              </li>
            ))}
      </ul>
    </section>
  );
};
