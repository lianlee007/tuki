import React from 'react';
import type { RestauranteDescubierto } from '../../tipos/modelos';
import { TarjetaRestaurante } from './TarjetaRestaurante';
import { ETIQUETA } from './estilos';

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
 * Van antes del feed de platos porque son una puerta distinta —entrar al menú
 * completo— y conviene decidirla con la foto del local, no con un plato suelto.
 * En móvil se apilan; desde tablet se leen en parejas, como una carta física.
 */
export const CarrilRestaurantes: React.FC<CarrilRestaurantesProps> = ({
  restaurantes,
  total,
  cargando,
  cocinaCoincidente,
}) => {
  if (!cargando && restaurantes.length === 0) return null;

  return (
    <section aria-labelledby="titulo-restaurantes">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-hearth-terracotta shadow-warm dark:bg-hearth-night-terracotta" />
          <div>
            <h2
              id="titulo-restaurantes"
              className={`${ETIQUETA} text-hearth-espresso dark:text-hearth-night-ink`}
            >
              Restaurantes aliados
            </h2>
            <p className="mt-0.5 text-[12px] text-hearth-pebble dark:text-hearth-night-pebble">
              {cargando
                ? 'Buscando cocinas cerca de ti…'
                : total === 1
                  ? '1 cocina para entrar'
                  : `${total.toLocaleString('es-CO')} cocinas para entrar`}
            </p>
          </div>
        </div>

        <span className="hidden text-[12px] font-semibold text-hearth-pebble sm:block dark:text-hearth-night-pebble">
          Precios de carta, sin recargos
        </span>
      </div>

      <div
        className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2"
        aria-busy={cargando}
      >
        {cargando && restaurantes.length === 0
          ? Array.from({ length: 2 }).map((_, indice) => (
              <div
                key={`esqueleto-${indice}`}
                aria-hidden="true"
                className="overflow-hidden rounded-3xl bg-hearth-card ring-1 ring-hearth-line/60 dark:bg-hearth-night-card dark:ring-white/5"
              >
                <div className="aspect-[16/10] animate-pulse bg-hearth-oat dark:bg-hearth-night-oat" />
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="w-2/3 space-y-2">
                    <div className="h-3 w-1/2 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
                    <div className="h-2.5 w-3/4 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
                  </div>
                  <div className="h-8 w-20 rounded-xl bg-hearth-oat dark:bg-hearth-night-oat" />
                </div>
              </div>
            ))
          : restaurantes.map((restaurante) => (
              <TarjetaRestaurante
                key={restaurante.id}
                restaurante={restaurante}
                cocinaCoincidente={cocinaCoincidente}
              />
            ))}
      </div>
    </section>
  );
};
