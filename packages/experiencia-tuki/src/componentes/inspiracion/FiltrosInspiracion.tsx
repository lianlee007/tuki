import React from 'react';
import { Flame, Leaf, RotateCcw, SlidersHorizontal, Sprout } from 'lucide-react';
import type { TipoCocina } from '../../tipos/modelos';
import {
  DIETAS,
  RANGOS_PRECIO,
  type ClaveDieta,
  type ClavePrecio,
} from '../descubrir/filtros';
import { iconoCocina } from '../descubrir/iconosCocina';
import { ETIQUETA, FOCO, TARJETA } from '../descubrir/estilos';

interface FiltrosInspiracionProps {
  cocinas: TipoCocina[];
  cocina: string;
  precio: ClavePrecio | '';
  dietas: ClaveDieta[];
  total: number;
  cargando: boolean;
  onCocina: (cocina: string) => void;
  onPrecio: (precio: ClavePrecio | '') => void;
  onDieta: (dieta: ClaveDieta) => void;
  onLimpiar: () => void;
  /** En móvil se convierte en un carril de pastillas. */
  compacto?: boolean;
}

const ICONO_DIETA: Record<ClaveDieta, React.ReactNode> = {
  vegetariano: <Leaf size={12} aria-hidden="true" />,
  vegano: <Sprout size={12} aria-hidden="true" />,
  picante: <Flame size={12} aria-hidden="true" />,
};

const OPCIONES_PRECIO = [
  { clave: '' as const, etiqueta: 'Todos' },
  ...Object.entries(RANGOS_PRECIO).map(([clave, rango]) => ({
    clave: clave as ClavePrecio,
    etiqueta: rango.etiqueta,
  })),
];

/**
 * Filtros rápidos de la baraja.
 *
 * Los mismos tres ejes que el feed —cocina, precio y preferencia— pero con una
 * diferencia importante: aquí no hay botón «Aplicar». Cada toque vuelve a
 * repartir la baraja al instante, y el carril de móvil conserva la lectura
 * horizontal del prototipo.
 */
export const FiltrosInspiracion: React.FC<FiltrosInspiracionProps> = ({
  cocinas,
  cocina,
  precio,
  dietas,
  total,
  cargando,
  onCocina,
  onPrecio,
  onDieta,
  onLimpiar,
  compacto = false,
}) => {
  const activos = (cocina ? 1 : 0) + (precio ? 1 : 0) + dietas.length;

  if (compacto) {
    return (
      <section aria-label="Filtros rápidos" className="mb-3">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-hearth-pebble dark:text-hearth-night-pebble">
            <SlidersHorizontal size={12} aria-hidden="true" />
            Filtros rápidos
          </span>
          <button
            type="button"
            onClick={onLimpiar}
            disabled={activos === 0}
            className={`af-pulsar inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-bold text-hearth-terracotta-ink transition-colors hover:bg-hearth-terracotta-soft disabled:cursor-not-allowed disabled:opacity-40 dark:text-hearth-night-terracotta-ink dark:hover:bg-hearth-night-terracotta-soft ${FOCO}`}
          >
            <RotateCcw size={11} aria-hidden="true" />
            Limpiar
          </button>
        </div>

        <div className="af-sin-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <Pastilla activa={activos === 0} onClick={onLimpiar}>
            Todos
          </Pastilla>

          {OPCIONES_PRECIO.filter((opcion) => opcion.clave !== '').map((opcion) => {
            const activa = precio === opcion.clave;
            return (
              <Pastilla
                key={opcion.clave}
                activa={activa}
                onClick={() => onPrecio(activa ? '' : opcion.clave)}
              >
                {opcion.etiqueta}
              </Pastilla>
            );
          })}

          {DIETAS.map((dieta) => {
            const activa = dietas.includes(dieta.clave);
            return (
              <Pastilla
                key={dieta.clave}
                activa={activa}
                tono="sage"
                onClick={() => onDieta(dieta.clave)}
              >
                {ICONO_DIETA[dieta.clave]}
                {dieta.etiqueta}
              </Pastilla>
            );
          })}

          {cocinas.slice(0, 6).map((tipo) => {
            const Icono = iconoCocina(tipo.icono);
            const activa = cocina === tipo.slug;
            return (
              <Pastilla
                key={tipo.id}
                activa={activa}
                onClick={() => onCocina(activa ? '' : tipo.slug)}
              >
                <Icono size={12} aria-hidden="true" />
                {tipo.nombre}
              </Pastilla>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="titulo-filtros-inspiracion" className={`${TARJETA} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-hearth-terracotta-soft text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink">
            <SlidersHorizontal size={16} aria-hidden="true" />
          </span>
          <div>
            <h2
              id="titulo-filtros-inspiracion"
              className="font-jakarta text-sm font-extrabold text-hearth-espresso dark:text-hearth-night-ink"
            >
              Filtros rápidos
            </h2>
            <p className="text-[10px] font-semibold text-hearth-pebble dark:text-hearth-night-pebble">
              {cargando ? 'Repartiendo…' : `${total.toLocaleString('es-CO')} platos`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLimpiar}
          disabled={activos === 0}
          className={`af-pulsar inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-hearth-terracotta-ink transition-colors hover:bg-hearth-terracotta-soft disabled:cursor-not-allowed disabled:opacity-40 dark:text-hearth-night-terracotta-ink dark:hover:bg-hearth-night-terracotta-soft ${FOCO}`}
        >
          <RotateCcw size={12} aria-hidden="true" />
          Reiniciar
        </button>
      </div>

      <div className="mt-4">
        <p className={`${ETIQUETA} text-[9px] text-hearth-pebble dark:text-hearth-night-pebble`}>
          Cocina
        </p>
        <div className="af-sin-scrollbar mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          <Pastilla activa={!cocina} onClick={() => onCocina('')}>
            Todas
          </Pastilla>
          {cocinas.map((tipo) => {
            const Icono = iconoCocina(tipo.icono);
            const activa = cocina === tipo.slug;
            return (
              <Pastilla
                key={tipo.id}
                activa={activa}
                onClick={() => onCocina(activa ? '' : tipo.slug)}
              >
                <Icono size={12} aria-hidden="true" />
                {tipo.nombre}
              </Pastilla>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <p className={`${ETIQUETA} text-[9px] text-hearth-pebble dark:text-hearth-night-pebble`}>
          Rango de precio
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {OPCIONES_PRECIO.map((opcion) => {
            const activa = precio === opcion.clave;
            return (
              <button
                key={opcion.clave || 'todos'}
                type="button"
                aria-pressed={activa}
                onClick={() => onPrecio(activa ? '' : opcion.clave)}
                className={`af-pulsar rounded-xl px-2.5 py-2 text-[11px] font-bold transition-colors ${FOCO} ${
                  activa
                    ? 'bg-hearth-terracotta-deep text-white shadow-warm dark:bg-hearth-night-terracotta dark:text-hearth-night'
                    : 'bg-hearth-oat text-hearth-pebble hover:text-hearth-espresso dark:bg-hearth-night-oat dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink'
                }`}
              >
                {opcion.etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <p className={`${ETIQUETA} text-[9px] text-hearth-pebble dark:text-hearth-night-pebble`}>
          Preferencias
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DIETAS.map((dieta) => {
            const activa = dietas.includes(dieta.clave);
            return (
              <button
                key={dieta.clave}
                type="button"
                aria-pressed={activa}
                onClick={() => onDieta(dieta.clave)}
                className={`af-pulsar inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold transition-colors ${FOCO} ${
                  activa
                    ? 'bg-hearth-sage text-white shadow-warm dark:bg-hearth-night-sage-ink dark:text-hearth-night'
                    : 'bg-hearth-sage-soft text-hearth-sage-ink hover:bg-[#E1EDE2] dark:bg-hearth-night-sage-soft dark:text-hearth-night-sage-ink dark:hover:bg-[#253C2A]'
                }`}
              >
                {ICONO_DIETA[dieta.clave]}
                {dieta.etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-hearth-oat/70 p-3 text-[10.5px] leading-relaxed text-hearth-pebble ring-1 ring-hearth-line/60 dark:bg-hearth-night-oat/70 dark:text-hearth-night-pebble dark:ring-hearth-night-line/60">
        Cada filtro vuelve a repartir la baraja. Los platos que ya aprobaste
        siguen en <strong className="font-extrabold text-hearth-espresso dark:text-hearth-night-ink">Inspiración en vivo</strong>.
      </div>
    </section>
  );
};

interface PastillaProps {
  activa: boolean;
  tono?: 'terracota' | 'sage';
  onClick: () => void;
  children: React.ReactNode;
}

const Pastilla: React.FC<PastillaProps> = ({ activa, tono = 'terracota', onClick, children }) => (
  <button
    type="button"
    aria-pressed={activa}
    onClick={onClick}
    className={`af-pulsar inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${FOCO} ${
      activa
        ? tono === 'sage'
          ? 'bg-hearth-sage text-white shadow-warm dark:bg-hearth-night-sage-ink dark:text-hearth-night'
          : 'bg-hearth-terracotta-deep text-white shadow-warm dark:bg-hearth-night-terracotta dark:text-hearth-night'
        : 'bg-hearth-oat text-hearth-pebble hover:text-hearth-espresso dark:bg-hearth-night-oat dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink'
    }`}
  >
    {children}
  </button>
);
