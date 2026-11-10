import React from 'react';
import { X } from 'lucide-react';
import type { RestauranteDescubierto } from '../../tipos/modelos';
import { Hoja } from './Hoja';
import { TarjetaRestaurante } from './TarjetaRestaurante';
import { FOCO } from './estilos';

interface PanelRestaurantesProps {
  abierto: boolean;
  restaurantes: RestauranteDescubierto[];
  total: number;
  cargando: boolean;
  cocinaCoincidente?: string | null;
  onCerrar: () => void;
}

/**
 * La lista completa de restaurantes, sin salir de la portada.
 *
 * Existe porque la sección de arriba solo enseña dos perfiles en móvil. Aquí
 * caben todos, en la misma cuadrícula compacta, y el pulgar no tiene que cruzar
 * medio feed para volver al inicio.
 */
export const PanelRestaurantes: React.FC<PanelRestaurantesProps> = ({
  abierto,
  restaurantes,
  total,
  cargando,
  cocinaCoincidente,
  onCerrar,
}) => (
  <Hoja abierto={abierto} onCerrar={onCerrar} tituloId="titulo-panel-restaurantes" ancho="lg">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2
          id="titulo-panel-restaurantes"
          className="font-jakarta text-[22px] font-extrabold tracking-[-0.03em] text-hearth-espresso dark:text-hearth-night-ink"
        >
          Restaurantes
        </h2>
        <p className="mt-1 text-[12.5px] text-hearth-pebble dark:text-hearth-night-pebble">
          {cargando
            ? 'Buscando restaurantes cerca de ti…'
            : total === 1
              ? 'Un restaurante para entrar'
              : `${total.toLocaleString('es-CO')} restaurantes para entrar`}
        </p>
      </div>

      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar los restaurantes"
        className={`af-pulsar flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-hearth-oat text-hearth-espresso transition-colors hover:text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:hover:text-hearth-night-terracotta ${FOCO}`}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>

    {!cargando && restaurantes.length === 0 ? (
      <div className="py-12 text-center">
        <p className="text-[14px] font-bold text-hearth-espresso dark:text-hearth-night-ink">
          No hay restaurantes con esta búsqueda
        </p>
        <p className="mx-auto mt-1 max-w-[28ch] text-[12.5px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
          Prueba con otra palabra o quita algún filtro desde el feed.
        </p>
      </div>
    ) : (
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
        {cargando && restaurantes.length === 0
          ? Array.from({ length: 4 }).map((_, indice) => (
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
            ))
          : restaurantes.map((restaurante, indice) => (
              <TarjetaRestaurante
                key={restaurante.id}
                restaurante={restaurante}
                cocinaCoincidente={cocinaCoincidente}
                prioridad={indice < 4}
              />
            ))}
      </div>
    )}
  </Hoja>
);
