import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Heart,
  Home,
  Search,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import { formatearPrecio } from '../../lib/utils';
import { FOCO } from './estilos';

interface BarraMovilProps {
  cantidadCarrito: number;
  totalCarrito: number;
  favoritosActivos: boolean;
  /** Solo un comensal puede abrir el carrito. */
  mostrarCarrito: boolean;
  rutaCuenta: string;
  onInicio: () => void;
  onBuscar: () => void;
  onFavoritos: () => void;
  onCarrito: () => void;
}

/**
 * Barra de navegación del pulgar.
 *
 * Las cinco acciones que de verdad se usan en el teléfono —volver al inicio,
 * buscar, favoritos, pedido y cuenta— siempre visibles. El carrito aparece con
 * su total en una pastilla flotante encima de la barra cuando hay algo dentro:
 * el número y el dinero dicen lo mismo, sin abrir nada.
 */
export const BarraMovil: React.FC<BarraMovilProps> = ({
  cantidadCarrito,
  totalCarrito,
  favoritosActivos,
  mostrarCarrito,
  rutaCuenta,
  onInicio,
  onBuscar,
  onFavoritos,
  onCarrito,
}) => {
  const item = `af-pulsar flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition-colors ${FOCO}`;

  return (
    <>
      {mostrarCarrito && cantidadCarrito > 0 && (
        <div className="fixed inset-x-3 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-30 lg:hidden">
          <button
            type="button"
            onClick={onCarrito}
            className="af-pulsar mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-hearth-terracotta-deep px-4 py-3 text-white shadow-warm-xl transition-colors hover:bg-hearth-terracotta-ink dark:bg-hearth-night-terracotta dark:text-hearth-night dark:hover:bg-[#F6A184]"
          >
            <span className="flex min-w-0 items-center gap-2 text-[12px] font-extrabold">
              <ShoppingBag size={16} aria-hidden="true" />
              <span className="truncate">
                {cantidadCarrito} {cantidadCarrito === 1 ? 'producto' : 'productos'}
              </span>
              <span aria-hidden="true" className="opacity-70">
                ·
              </span>
              <span className="tabular-nums">{formatearPrecio(totalCarrito)}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-extrabold">
              Ver pedido
              <ArrowUpRight size={14} aria-hidden="true" />
            </span>
          </button>
        </div>
      )}

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hearth-line/80 bg-hearth-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden dark:border-hearth-night-line dark:bg-hearth-night/95"
      >
        <div className="mx-auto flex max-w-md items-stretch gap-0.5 px-2 py-1">
          <button
            type="button"
            onClick={onInicio}
            className={`${item} text-hearth-pebble hover:text-hearth-terracotta-ink dark:text-hearth-night-pebble dark:hover:text-hearth-night-terracotta`}
          >
            <Home size={19} aria-hidden="true" />
            Inicio
          </button>

          <button
            type="button"
            onClick={onBuscar}
            className={`${item} text-hearth-pebble hover:text-hearth-terracotta-ink dark:text-hearth-night-pebble dark:hover:text-hearth-night-terracotta`}
          >
            <Search size={19} aria-hidden="true" />
            Buscar
          </button>

          <button
            type="button"
            onClick={onFavoritos}
            aria-pressed={favoritosActivos}
            className={`${item} ${
              favoritosActivos
                ? 'text-hearth-terracotta-ink dark:text-hearth-night-terracotta'
                : 'text-hearth-pebble hover:text-hearth-terracotta-ink dark:text-hearth-night-pebble dark:hover:text-hearth-night-terracotta'
            }`}
          >
            <Heart
              size={19}
              aria-hidden="true"
              className={favoritosActivos ? 'fill-current' : undefined}
            />
            Favoritos
          </button>

          {mostrarCarrito ? (
            <button
              type="button"
              onClick={onCarrito}
              className={`${item} relative text-hearth-pebble hover:text-hearth-terracotta-ink dark:text-hearth-night-pebble dark:hover:text-hearth-night-terracotta`}
            >
              <span className="relative">
                <ShoppingBag size={19} aria-hidden="true" />
                {cantidadCarrito > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-hearth-terracotta-deep px-1 text-[9px] font-extrabold tabular-nums text-white dark:bg-hearth-night-terracotta dark:text-hearth-night">
                    {cantidadCarrito > 9 ? '9+' : cantidadCarrito}
                  </span>
                )}
              </span>
              Pedido
            </button>
          ) : (
            <Link
              to="/para-restaurantes"
              className={`${item} text-hearth-pebble hover:text-hearth-terracotta-ink dark:text-hearth-night-pebble dark:hover:text-hearth-night-terracotta`}
            >
              <ArrowUpRight size={19} aria-hidden="true" />
              Cocinas
            </Link>
          )}

          <Link
            to={rutaCuenta}
            className={`${item} text-hearth-pebble hover:text-hearth-terracotta-ink dark:text-hearth-night-pebble dark:hover:text-hearth-night-terracotta`}
          >
            <UserRound size={19} aria-hidden="true" />
            Cuenta
          </Link>
        </div>
      </nav>
    </>
  );
};
