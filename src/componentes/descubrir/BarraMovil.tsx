import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, Home, Layers, Search, UserRound } from 'lucide-react';
import { FOCO } from './estilos';

interface BarraMovilProps {
  favoritosActivos: boolean;
  rutaCuenta: string;
  onInicio: () => void;
  onBuscar: () => void;
  onFavoritos: () => void;
}

/**
 * Barra de navegación del pulgar.
 *
 * Las acciones que de verdad se usan en el teléfono —volver al inicio, buscar,
 * entrar a la baraja de Inspiración, favoritos, cocinas y cuenta— siempre
 * visibles. El carrito no se repite aquí: vive en la barra superior, que es su
 * único punto de entrada.
 */
export const BarraMovil: React.FC<BarraMovilProps> = ({
  favoritosActivos,
  rutaCuenta,
  onInicio,
  onBuscar,
  onFavoritos,
}) => {
  const item = `af-pulsar flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition-colors ${FOCO}`;

  return (
    <>
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

          <Link
            to="/inspiracion"
            className={`${item} text-hearth-terracotta-ink hover:text-hearth-terracotta-deep dark:text-hearth-night-terracotta-ink dark:hover:text-hearth-night-terracotta`}
          >
            <Layers size={19} aria-hidden="true" />
            Swipe
          </Link>

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

          <Link
            to="/para-restaurantes"
            className={`${item} text-hearth-pebble hover:text-hearth-terracotta-ink dark:text-hearth-night-pebble dark:hover:text-hearth-night-terracotta`}
          >
            <ArrowUpRight size={19} aria-hidden="true" />
            Cocinas
          </Link>

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
