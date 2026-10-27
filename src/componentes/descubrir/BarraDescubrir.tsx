import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link } from 'react-router-dom';
import { LogOut, Search, ShoppingBag, Store, UserRound, X } from 'lucide-react';
import { useAuth, type Rol } from '../../contexto/ContextoAutenticacion';
import { MarcaTuki, ThemeToggle } from '../ui';

/**
 * Menú de la cuenta en la barra pública.
 *
 * Antes la sesión solo se podía cerrar con un icono suelto y «Mi cuenta» no
 * existía. El avatar reúne las tres cosas que una persona busca ahí: quién es,
 * a dónde ir y cómo salir.
 */
const MenuCuenta: React.FC = () => {
  const { user, rol, cerrarSesion } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const alClicFuera = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const alEscape = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAbierto(false);
    };

    document.addEventListener('mousedown', alClicFuera);
    document.addEventListener('keydown', alEscape);
    return () => {
      document.removeEventListener('mousedown', alClicFuera);
      document.removeEventListener('keydown', alEscape);
    };
  }, [abierto]);

  if (!user) return null;

  const nombre =
    [user.user_metadata?.nombre, user.user_metadata?.apellido]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    user.email?.split('@')[0] ||
    'Tu cuenta';
  const inicial = nombre.charAt(0).toUpperCase() || '·';

  const fila =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors';

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Abrir el menú de tu cuenta"
        title="Tu cuenta"
        className="af-pulsar flex h-9 w-9 items-center justify-center rounded-full bg-af-accent/10 text-sm font-bold text-af-accent-text ring-1 ring-af/15 transition-colors hover:bg-af-accent/20"
      >
        {inicial}
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-af/20 bg-af-surface p-2 shadow-xl"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-af-ink">{nombre}</p>
            <p className="truncate text-xs text-af-ink-secondary">{user.email}</p>
          </div>

          <div className="my-1 h-px bg-af/15" />

          <Link
            to="/mi-cuenta"
            role="menuitem"
            onClick={() => setAbierto(false)}
            className={`${fila} text-af-ink hover:bg-af-ink/[0.06]`}
          >
            <UserRound size={16} /> Mi cuenta
          </Link>

          {rol === 'restaurante' && (
            <Link
              to="/panel"
              role="menuitem"
              onClick={() => setAbierto(false)}
              className={`${fila} text-af-ink hover:bg-af-ink/[0.06]`}
            >
              <Store size={16} /> Mi panel
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setAbierto(false);
              await cerrarSesion();
            }}
            className={`${fila} text-af-danger-text hover:bg-af-danger/10`}
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

interface BarraDescubrirProps {
  consulta: string;
  onConsulta: (texto: string) => void;
  onCarrito: () => void;
  cantidadCarrito: number;
}

interface AccionesProps {
  compacto?: boolean;
  hayUsuario: boolean;
  rol: Rol | null;
  cargandoRol: boolean;
  cantidadCarrito: number;
  onCarrito: () => void;
}

/**
 * Las acciones de la barra cambian con el papel de la cuenta: un comensal ve su
 * carrito y su salida; un restaurante ve el panel; quien no ha entrado ve la
 * puerta de `/entrar`, no la de venta.
 *
 * Vive fuera del componente para que escribir en el buscador no vuelva a
 * montar los botones en cada tecla.
 */
const Acciones: React.FC<AccionesProps> = ({
  compacto = false,
  hayUsuario,
  rol,
  cargandoRol,
  cantidadCarrito,
  onCarrito,
}) => (
  <div className="flex items-center gap-1.5">
    <ThemeToggle />

    {hayUsuario && cargandoRol ? null : !hayUsuario ? (
      <Link
        to="/entrar"
        className={
          compacto
            ? 'rounded-full px-3 py-2 text-[13px] font-semibold text-af-ink-secondary'
            : 'af-pulsar rounded-full bg-af-ink px-4 py-2 text-[13px] font-semibold text-af-ground transition-opacity hover:opacity-90'
        }
      >
        Entrar
      </Link>
    ) : (
      <>
        {rol === 'cliente' && (
          <button
            type="button"
            onClick={onCarrito}
            aria-label={
              cantidadCarrito > 0
                ? `Abrir el carrito, ${cantidadCarrito} ${cantidadCarrito === 1 ? 'producto' : 'productos'}`
                : 'Abrir el carrito'
            }
            className="af-pulsar relative rounded-full bg-af-surface p-2.5 text-af-ink transition-colors hover:text-af-accent-text"
          >
            <ShoppingBag size={18} aria-hidden="true" />
            {cantidadCarrito > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-af-accent-solid px-1 text-[10px] font-bold tabular-nums text-white">
                {cantidadCarrito > 9 ? '9+' : cantidadCarrito}
              </span>
            )}
          </button>
        )}

        {rol === 'restaurante' && (
          <Link
            to="/panel"
            className={
              compacto
                ? 'rounded-full px-3 py-2 text-[13px] font-semibold text-af-ink-secondary'
                : 'af-pulsar rounded-full bg-af-surface px-4 py-2 text-[13px] font-semibold text-af-ink transition-colors hover:text-af-accent-text'
            }
          >
            Mi panel
          </Link>
        )}

        <MenuCuenta />
      </>
    )}
  </div>
);

/**
 * La barra de Descubrir.
 *
 * El buscador es el producto, así que vive siempre visible y con el foco a un
 * toque: no se esconde detrás de un icono que abre una pantalla nueva. En
 * móvil se parte en dos filas y el campo ocupa el ancho completo, que es donde
 * de verdad se usa.
 */
export const BarraDescubrir: React.FC<BarraDescubrirProps> = ({
  consulta,
  onConsulta,
  onCarrito,
  cantidadCarrito,
}) => {
  const { user, rol, cargandoRol } = useAuth();

  const acciones = (compacto: boolean) => (
    <Acciones
      compacto={compacto}
      hayUsuario={Boolean(user)}
      rol={rol}
      cargandoRol={cargandoRol}
      cantidadCarrito={cantidadCarrito}
      onCarrito={onCarrito}
    />
  );

  return (
    <header className="nav-af sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-5 py-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="af-pulsar flex shrink-0 items-center" aria-label="Tuki, descubrir platos">
            <MarcaTuki tamano={20} titulo="" />
          </Link>

          <div className="ml-auto sm:hidden">{acciones(true)}</div>
        </div>

        <form
          role="search"
          className="relative order-last w-full sm:order-none sm:flex-1"
          onSubmit={(e) => e.preventDefault()}
        >
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-af-ink-secondary"
          />
          <input
            type="search"
            value={consulta}
            onChange={(e) => onConsulta(e.target.value)}
            placeholder="Busca un plato, un restaurante o una cocina"
            aria-label="Buscar platos, restaurantes o cocinas"
            autoComplete="off"
            className="h-11 w-full appearance-none rounded-full bg-af-surface pl-10 pr-10 text-[15px] text-af-ink outline-none transition-colors placeholder:text-af-ink-secondary focus:bg-af-ground focus:ring-2 focus:ring-af-accent/40"
          />
          {consulta && (
            <button
              type="button"
              onClick={() => onConsulta('')}
              aria-label="Borrar la búsqueda"
              className="af-pulsar absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-af-ink-secondary"
            >
              <X size={16} />
            </button>
          )}
        </form>

        <div className="hidden sm:block">{acciones(false)}</div>
      </div>
    </header>
  );
};
