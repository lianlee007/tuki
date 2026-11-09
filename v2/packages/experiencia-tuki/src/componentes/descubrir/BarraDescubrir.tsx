import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link, NavLink } from 'react-router-dom';
import { LogOut, Search, ShoppingBag, ShoppingCart, Store, UserRound, X } from 'lucide-react';
import { useAuth, type Rol } from '../../contexto/ContextoAutenticacion';
import { ThemeToggle } from '../ui';
import { FOCO } from './estilos';

/**
 * Menú de la cuenta en la barra pública.
 *
 * Reúne las tres cosas que una persona busca ahí: quién es, a dónde ir y cómo
 * salir. Se cierra al pulsar fuera o con Escape, igual que antes.
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

  const fila = `flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${FOCO}`;

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Abrir el menú de tu cuenta"
        title="Tu cuenta"
        className={`af-pulsar flex h-10 w-10 items-center justify-center rounded-xl bg-hearth-terracotta-soft text-sm font-extrabold text-hearth-terracotta-ink ring-1 ring-hearth-terracotta/20 transition-colors hover:bg-[#FBE2D9] dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink dark:ring-white/10 dark:hover:bg-[#4A2D24] ${FOCO}`}
      >
        {inicial}
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl bg-hearth-card p-2 shadow-warm-xl ring-1 ring-hearth-line dark:bg-hearth-night-card dark:ring-hearth-night-line"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-bold text-hearth-espresso dark:text-hearth-night-ink">
              {nombre}
            </p>
            <p className="truncate text-xs text-hearth-pebble dark:text-hearth-night-pebble">
              {user.email}
            </p>
          </div>

          <div className="my-1 h-px bg-hearth-line dark:bg-hearth-night-line" />

          <Link
            to="/mi-cuenta"
            role="menuitem"
            onClick={() => setAbierto(false)}
            className={`${fila} text-hearth-espresso hover:bg-hearth-oat dark:text-hearth-night-ink dark:hover:bg-hearth-night-oat`}
          >
            <UserRound size={16} aria-hidden="true" /> Mi cuenta
          </Link>

          {rol === 'restaurante' && (
            <Link
              to="/panel"
              role="menuitem"
              onClick={() => setAbierto(false)}
              className={`${fila} text-hearth-espresso hover:bg-hearth-oat dark:text-hearth-night-ink dark:hover:bg-hearth-night-oat`}
            >
              <Store size={16} aria-hidden="true" /> Mi panel
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setAbierto(false);
              await cerrarSesion();
            }}
            className={`${fila} text-[#A3231C] hover:bg-[#FBE9E7] dark:text-[#FF9B91] dark:hover:bg-[#3A1D1A]`}
          >
            <LogOut size={16} aria-hidden="true" /> Cerrar sesión
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
  /** La barra móvil enfoca el buscador desde abajo: el campo vive aquí. */
  inputRef?: React.RefObject<HTMLInputElement | null>;
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
 * Las acciones cambian con el papel de la cuenta: un comensal ve su carrito y
 * su salida; un restaurante ve el panel; quien no ha entrado ve la puerta de
 * `/entrar`, no la de venta. Vive fuera del componente para que escribir en el
 * buscador no vuelva a montar los botones en cada tecla.
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

    {/* El carrito vive siempre en la barra superior: el detalle solo se abre
        al hacer clic aquí, nunca como un letrero fijo en la parte de abajo. */}
    <button
      type="button"
      onClick={onCarrito}
      aria-label={
        cantidadCarrito > 0
          ? `Abrir el carrito, ${cantidadCarrito} ${cantidadCarrito === 1 ? 'producto' : 'productos'}`
          : 'Abrir el carrito'
      }
      className={`af-pulsar relative flex h-10 w-10 items-center justify-center rounded-xl bg-hearth-oat text-hearth-espresso transition-colors hover:text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:hover:text-hearth-night-terracotta ${FOCO}`}
    >
      <ShoppingBag size={18} aria-hidden="true" />
      {cantidadCarrito > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-hearth-terracotta-deep px-1 text-[10px] font-extrabold tabular-nums text-white dark:bg-hearth-night-terracotta dark:text-hearth-night">
          {cantidadCarrito > 9 ? '9+' : cantidadCarrito}
        </span>
      )}
    </button>

    {hayUsuario && cargandoRol ? null : !hayUsuario ? (
      <Link
        to="/entrar"
        className={
          compacto
            ? 'af-pulsar rounded-xl px-3 py-2 text-[13px] font-bold text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink'
            : `af-pulsar inline-flex items-center rounded-xl bg-hearth-terracotta-deep px-4 py-2.5 text-[13px] font-bold text-white shadow-warm transition-colors hover:bg-hearth-terracotta-ink dark:bg-hearth-night-terracotta dark:text-hearth-night dark:hover:bg-[#F6A184] ${FOCO}`
        }
      >
        Entrar
      </Link>
    ) : (
      <>
        {rol === 'restaurante' && (
          <Link
            to="/panel"
            className={
              compacto
                ? 'rounded-xl px-3 py-2 text-[13px] font-bold text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink'
                : `af-pulsar inline-flex items-center gap-2 rounded-xl bg-hearth-oat px-4 py-2.5 text-[13px] font-bold text-hearth-espresso transition-colors hover:text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:hover:text-hearth-night-terracotta ${FOCO}`
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
 * toque. En móvil se parte en dos filas y el campo ocupa el ancho completo; en
 * escritorio se sienta entre la marca y las acciones. La barra es translúcida
 * para que el papel cálido se asome por debajo al hacer scroll.
 */
export const BarraDescubrir: React.FC<BarraDescubrirProps> = ({
  consulta,
  onConsulta,
  onCarrito,
  cantidadCarrito,
  inputRef,
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
    <header className="sticky top-0 z-40 border-b border-hearth-line/70 bg-hearth-cream/90 backdrop-blur-xl dark:border-hearth-night-line/80 dark:bg-hearth-night/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className={`af-pulsar flex shrink-0 items-center gap-2.5 ${FOCO} rounded-xl`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-hearth-terracotta to-[#EE8062] text-white shadow-warm dark:from-hearth-night-terracotta dark:to-[#E97A56] dark:text-hearth-night">
              <ShoppingCart size={22} aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-jakarta text-lg font-extrabold tracking-[-0.03em] text-hearth-espresso dark:text-hearth-night-ink">
                TukiTuki
              </span>
              <span className="truncate text-[10px] font-extrabold uppercase tracking-[0.16em] text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink">
                Mercado culinario
              </span>
            </span>
          </Link>

          <div className="ml-auto sm:hidden">{acciones(true)}</div>
        </div>

        <nav
          aria-label="Secciones"
          className="hidden items-center gap-1 lg:flex"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-xl px-3 py-2 text-[13px] font-bold transition-colors ${FOCO} ${
                isActive
                  ? 'bg-hearth-terracotta-soft text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink'
                  : 'text-hearth-pebble hover:text-hearth-espresso dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink'
              }`
            }
          >
            Explorar
          </NavLink>
          <Link
            to="/para-restaurantes"
            className={`rounded-xl px-3 py-2 text-[13px] font-bold text-hearth-pebble transition-colors hover:text-hearth-espresso dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink ${FOCO}`}
          >
            Para restaurantes
          </Link>
        </nav>

        <form
          role="search"
          className="relative order-last w-full sm:order-none sm:max-w-xl sm:flex-1"
          onSubmit={(evento) => evento.preventDefault()}
        >
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-hearth-pebble dark:text-hearth-night-pebble"
          />
          <input
            ref={inputRef}
            id="buscador-descubrir"
            type="search"
            value={consulta}
            onChange={(evento) => onConsulta(evento.target.value)}
            placeholder="Busca un plato, un restaurante o una cocina"
            aria-label="Buscar platos, restaurantes o cocinas"
            autoComplete="off"
            className="h-11 w-full appearance-none rounded-2xl bg-hearth-oat pl-10 pr-10 text-[15px] text-hearth-espresso outline-none transition-colors placeholder:text-hearth-pebble focus:bg-hearth-card focus:ring-2 focus:ring-hearth-terracotta/50 dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:placeholder:text-hearth-night-pebble dark:focus:bg-hearth-night-card dark:focus:ring-hearth-night-terracotta/40"
          />
          {consulta && (
            <button
              type="button"
              onClick={() => onConsulta('')}
              aria-label="Borrar la búsqueda"
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-hearth-pebble transition-colors hover:text-hearth-espresso dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink ${FOCO}`}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </form>

        <div className="hidden sm:block">{acciones(false)}</div>
      </div>
    </header>
  );
};
