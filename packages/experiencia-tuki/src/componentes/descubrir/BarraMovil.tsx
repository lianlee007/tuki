import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { Home, Layers, Search, ShoppingBag, UserRound } from 'lucide-react';
import { FOCO } from './estilos';

interface BarraMovilProps {
  rutaCuenta: string;
  cantidadCarrito: number;
  onInicio: () => void;
  onBuscar: () => void;
  onCarrito: () => void;
}

/**
 * Barra de navegación del pulgar.
 *
 * Cuatro destinos y nada más: volver al inicio, buscar, abrir la baraja de
 * Inspiración y entrar a la cuenta. Favoritos vive en la cabecera del feed
 * (es un filtro, no un destino) y «Cocinas» se fue: apuntaba a la landing de
 * restaurantes y el nombre mentía. Con cuatro acciones cada objetivo recupera
 * espacio y se puede tocar sin apuntar.
 */
export const BarraMovil: React.FC<BarraMovilProps> = ({
  rutaCuenta,
  cantidadCarrito,
  onInicio,
  onBuscar,
  onCarrito,
}) => {
  const item = `af-pulsar flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-bold transition-colors ${FOCO}`;
  const apagado =
    'text-hearth-pebble hover:text-hearth-terracotta-ink dark:text-hearth-night-pebble dark:hover:text-hearth-night-terracotta';

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hearth-line/80 bg-hearth-card pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-hearth-night-line dark:bg-hearth-night"
    >
      <div className="mx-auto flex max-w-md items-stretch gap-1 px-3 py-1.5">
        <button type="button" onClick={onInicio} className={`${item} ${apagado}`}>
          <Home size={20} aria-hidden="true" />
          Inicio
        </button>

        <button type="button" onClick={onBuscar} className={`${item} ${apagado}`}>
          <Search size={20} aria-hidden="true" />
          Buscar
        </button>

        <button
          type="button"
          onClick={onCarrito}
          aria-label={
            cantidadCarrito > 0
              ? `Abrir el carrito, ${cantidadCarrito} ${cantidadCarrito === 1 ? 'producto' : 'productos'}`
              : 'Abrir el carrito'
          }
          className={`${item} relative ${apagado}`}
        >
          <span className="relative">
            <ShoppingBag size={20} aria-hidden="true" />
            {cantidadCarrito > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-hearth-terracotta-deep px-1 text-[9px] font-extrabold tabular-nums text-white dark:bg-hearth-night-terracotta dark:text-hearth-night">
                {cantidadCarrito > 9 ? '9+' : cantidadCarrito}
              </span>
            )}
          </span>
          Carrito
        </button>

        <Link
          to="/inspiracion"
          className={`${item} text-hearth-terracotta-ink hover:text-hearth-terracotta-deep dark:text-hearth-night-terracotta-ink dark:hover:text-hearth-night-terracotta`}
        >
          <Layers size={20} aria-hidden="true" />
          Swipe
        </Link>

        <Link to={rutaCuenta} className={`${item} ${apagado}`}>
          <UserRound size={20} aria-hidden="true" />
          Cuenta
        </Link>
      </div>
    </nav>
  );
};
