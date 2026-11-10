import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, SlidersHorizontal, UtensilsCrossed } from 'lucide-react';
import type { PlatoDescubierto } from '../../tipos/modelos';
import type { DireccionBaraja } from '../../hooks/useBaraja';
import { BOTON_PRIMARIO, TARJETA } from '../descubrir/estilos';
import { TarjetaInspiracion } from './TarjetaInspiracion';

interface BarajaInspiracionProps {
  platos: PlatoDescubierto[];
  salida: DireccionBaraja;
  cargando: boolean;
  error: string | null;
  /** Total que devolvió el servidor para el filtro actual. */
  total: number;
  hayFiltros: boolean;
  onDecidir: (plato: PlatoDescubierto, direccion: DireccionBaraja) => void;
  /** Vuelve a pedir platos para el filtro actual. */
  onReintentar: () => void;
  /** Reparte otra vez las cartas que ya están en memoria. */
  onReiniciar: () => void;
  onLimpiar: () => void;
}

/**
 * El alto incluye 24 px de aire arriba: ahí asoman los cantos de las dos
 * tarjetas que esperan detrás, como en una baraja de verdad.
 */
const ALTO = 'h-[clamp(494px,67vh,604px)]';
const AREA_CARTA = 'absolute inset-x-0 bottom-0 top-6';

/**
 * La pila de tarjetas.
 *
 * Solo se pintan tres a la vez: la activa y dos promesas detrás. AnimatePresence
 * conserva la tarjeta que sale el tiempo justo para lanzarla fuera de pantalla;
 * las demás suben de puesto con el mismo muelle que usa el arrastre. Mantener
 * la pila corta evita montar imágenes que nadie va a mirar.
 */
export const BarajaInspiracion: React.FC<BarajaInspiracionProps> = ({
  platos,
  salida,
  cargando,
  error,
  total,
  hayFiltros,
  onDecidir,
  onReintentar,
  onReiniciar,
  onLimpiar,
}) => {
  if (cargando) return <EsqueletoBaraja />;

  if (error) {
    return (
      <EstadoBaraja
        icono={<UtensilsCrossed size={24} aria-hidden="true" />}
        titulo="No pudimos servir la baraja"
        texto={error}
        accion={
          <button type="button" onClick={onReintentar} className={BOTON_PRIMARIO}>
            <RotateCcw size={15} aria-hidden="true" />
            Reintentar
          </button>
        }
      />
    );
  }

  if (platos.length === 0) {
    if (total === 0 && hayFiltros) {
      return (
        <EstadoBaraja
          icono={<SlidersHorizontal size={24} aria-hidden="true" />}
          titulo="Ningún plato con esos filtros"
          texto="Prueba con otro precio, otra cocina o quita alguna preferencia. La baraja se reparte de nuevo al instante."
          accion={
            <button type="button" onClick={onLimpiar} className={BOTON_PRIMARIO}>
              Quitar los filtros
            </button>
          }
        />
      );
    }

    if (total === 0) {
      return (
        <EstadoBaraja
          icono={<UtensilsCrossed size={24} aria-hidden="true" />}
          titulo="Todavía no hay platos publicados"
          texto="Cuando los restaurantes publiquen su carta, sus platos aparecerán aquí para que los descubras uno a uno."
        />
      );
    }

    return (
      <EstadoBaraja
        icono={<UtensilsCrossed size={24} aria-hidden="true" />}
        titulo="¡Exploraste toda la baraja!"
        texto="Viste todas las recomendaciones de este filtro. Puedes volver a repartir las mismas cartas o cambiar lo que buscas."
        accion={
          <button type="button" onClick={onReiniciar} className={BOTON_PRIMARIO}>
            <RotateCcw size={15} aria-hidden="true" />
            Volver a explorar
          </button>
        }
      />
    );
  }

  return (
    <div className={`relative mx-auto w-full max-w-md select-none ${ALTO}`}>
      <div className={AREA_CARTA}>
        <AnimatePresence initial={false} custom={salida}>
          {platos
            .slice(0, 3)
            .map((plato, indice) => ({ plato, indice }))
            .reverse()
            .map(({ plato, indice }) => (
              <TarjetaInspiracion
                key={plato.id}
                plato={plato}
                posicion={indice}
                onDecidir={onDecidir}
              />
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const EsqueletoBaraja: React.FC = () => (
  <div className={`relative mx-auto w-full max-w-md ${ALTO}`} aria-hidden="true">
    <div className="absolute inset-x-2 bottom-0 top-1.5 rounded-[26px] bg-hearth-oat/70 dark:bg-hearth-night-oat/70" />
    <div className="absolute inset-x-1 bottom-0 top-[18px] rounded-[26px] bg-hearth-oat dark:bg-hearth-night-oat" />
    <div className={`absolute inset-x-0 bottom-0 top-6 overflow-hidden rounded-[26px] ${TARJETA}`}>
      <div className="h-[52%] w-full bg-hearth-oat dark:bg-hearth-night-oat sm:h-[54%]" />
      <div className="p-5">
        <div className="h-5 w-3/4 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
        <div className="mt-2.5 h-3 w-1/2 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
        <div className="mt-4 h-3 w-full rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
        <div className="mt-2 h-3 w-4/5 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
        <div className="mt-5 flex gap-2">
          <div className="h-6 w-20 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
          <div className="h-6 w-16 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
          <div className="h-6 w-24 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
        </div>
      </div>
    </div>
  </div>
);

interface EstadoBarajaProps {
  icono: React.ReactNode;
  titulo: string;
  texto: string;
  accion?: React.ReactNode;
}

const EstadoBaraja: React.FC<EstadoBarajaProps> = ({ icono, titulo, texto, accion }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
    className={`mx-auto flex w-full max-w-md flex-col items-center justify-center px-6 text-center ${TARJETA} ${ALTO}`}
    role="status"
    aria-live="polite"
  >
    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-hearth-oat text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-terracotta-ink">
      {icono}
    </span>
    <h2 className="mt-4 font-jakarta text-xl font-extrabold tracking-[-0.02em] text-hearth-espresso dark:text-hearth-night-ink">
      {titulo}
    </h2>
    <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
      {texto}
    </p>
    {accion && <div className="mt-5">{accion}</div>}
  </motion.div>
);
