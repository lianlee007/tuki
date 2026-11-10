import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { Heart, Home, Sparkles, Store, UserRound } from 'lucide-react';
import { FOCO } from './estilos';

interface BarraMovilProps {
  rutaCuenta: string;
  cantidadFavoritos: number;
  favoritosActivos: boolean;
  restaurantesActivo: boolean;
  onInicio: () => void;
  onRestaurantes: () => void;
  onFavoritos: () => void;
}

/**
 * La barra del pulgar.
 *
 * Cinco destinos reales: inicio, restaurantes, inspiración, guardados y cuenta.
 * El carrito vive en la barra superior junto al buscador —es una acción, no un
 * destino— y por eso no se repite aquí. Inspiración ocupa el centro y sube un
 * poco: es la acción que convierte «no sé qué comer» en una decisión.
 */
export const BarraMovil: React.FC<BarraMovilProps> = ({
  rutaCuenta,
  cantidadFavoritos,
  favoritosActivos,
  restaurantesActivo,
  onInicio,
  onRestaurantes,
  onFavoritos,
}) => {
  const inicioActivo = !favoritosActivos && !restaurantesActivo;

  const item = `af-pulsar flex min-w-0 flex-col items-center justify-end gap-0.5 rounded-xl px-1 pb-1 pt-0.5 text-[10px] font-bold leading-none transition-colors ${FOCO}`;
  const icono = 'flex h-7 w-10 items-center justify-center rounded-full transition-colors';
  const apagado =
    'text-hearth-pebble hover:text-hearth-terracotta-ink dark:text-hearth-night-pebble dark:hover:text-hearth-night-terracotta';
  const activo =
    'text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink';
  const iconoActivo =
    'bg-hearth-terracotta-soft dark:bg-hearth-night-terracotta-soft';

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hearth-line/70 bg-hearth-card pb-[calc(0.375rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_30px_-18px_rgba(78,42,29,0.28)] lg:hidden dark:border-hearth-night-line dark:bg-hearth-night dark:shadow-[0_-8px_30px_-18px_rgba(0,0,0,0.8)]"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-0.5 px-2">
        <button
          type="button"
          onClick={onInicio}
          aria-current={inicioActivo ? 'page' : undefined}
          className={`${item} ${inicioActivo ? activo : apagado}`}
        >
          <span className={`${icono} ${inicioActivo ? iconoActivo : ''}`}>
            <Home size={20} aria-hidden="true" />
          </span>
          Inicio
        </button>

        <button
          type="button"
          onClick={onRestaurantes}
          aria-pressed={restaurantesActivo}
          className={`${item} ${restaurantesActivo ? activo : apagado}`}
        >
          <span className={`${icono} ${restaurantesActivo ? iconoActivo : ''}`}>
            <Store size={20} aria-hidden="true" />
          </span>
          Locales
        </button>

        <Link
          to="/inspiracion"
          aria-label="Abrir Inspiración"
          className={`${item} group text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink`}
        >
          <span className="-mt-3 flex h-11 w-11 items-center justify-center rounded-full bg-hearth-terracotta-deep text-white shadow-warm-lg ring-4 ring-hearth-card transition-transform group-active:scale-95 dark:bg-hearth-night-terracotta dark:text-hearth-night dark:ring-hearth-night-card">
            <Sparkles size={20} aria-hidden="true" />
          </span>
          <span className="mt-0.5 text-[10px] font-extrabold tracking-[-0.01em]">
            Inspiración
          </span>
        </Link>

        <button
          type="button"
          onClick={onFavoritos}
          aria-pressed={favoritosActivos}
          aria-label={
            favoritosActivos
              ? 'Mostrar todos los platos'
              : 'Mostrar los platos guardados'
          }
          className={`${item} relative ${favoritosActivos ? activo : apagado}`}
        >
          <span className={`relative ${icono} ${favoritosActivos ? iconoActivo : ''}`}>
            <Heart
              size={20}
              aria-hidden="true"
              className={favoritosActivos ? 'fill-current' : undefined}
            />
            {cantidadFavoritos > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-hearth-terracotta-deep px-1 text-[9px] font-extrabold tabular-nums text-white ring-2 ring-hearth-card dark:bg-hearth-night-terracotta dark:text-hearth-night dark:ring-hearth-night">
                {cantidadFavoritos > 9 ? '9+' : cantidadFavoritos}
              </span>
            )}
          </span>
          Guardados
        </button>

        <Link
          to={rutaCuenta}
          aria-label={
            rutaCuenta === '/entrar'
              ? 'Entrar a tu cuenta'
              : rutaCuenta === '/panel'
                ? 'Abrir el panel del restaurante'
                : 'Abrir tu cuenta'
          }
          className={`${item} ${apagado}`}
        >
          <span className={icono}>
            <UserRound size={20} aria-hidden="true" />
          </span>
          Cuenta
        </Link>
      </div>
    </nav>
  );
};
