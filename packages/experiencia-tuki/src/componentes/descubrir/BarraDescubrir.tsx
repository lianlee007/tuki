import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link, NavLink } from 'react-router-dom';
import { LogOut, Search, ShoppingBag, Store, UserRound, X } from 'lucide-react';
import { useAuth, type Rol } from '../../contexto/ContextoAutenticacion';
import { PalabraTuki, SimboloTuki, ThemeToggle } from '../ui';
import { FOCO } from './estilos';

/**
 * Menú de la cuenta en la barra pública.
 *
 * Reúne las tres cosas que una persona busca ahí: quién es, a dónde ir y cómo
 * salir. Se cierra al pulsar fuera o con Escape.
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
  /** El logo vuelve al inicio de la portada y limpia la vista guardada. */
  onInicio?: () => void;
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
 * Las acciones de la barra.
 *
 * En móvil el espacio es de la marca, el buscador y el carrito; la cuenta vive
 * en la barra del pulgar. En escritorio se suma el acceso a la cuenta y, si la
 * sesión es de restaurante, el panel.
 */
const Acciones: React.FC<AccionesProps> = ({
  compacto = false,
  hayUsuario,
  rol,
  cargandoRol,
  cantidadCarrito,
  onCarrito,
}) => (
  <div className="flex items-center gap-1.5 sm:gap-2">
    <ThemeToggle compacto={compacto} conFondo={!compacto} />

    <button
      type="button"
      onClick={onCarrito}
      aria-label={
        cantidadCarrito > 0
          ? `Abrir el carrito, ${cantidadCarrito} ${cantidadCarrito === 1 ? 'producto' : 'productos'}`
          : 'Abrir el carrito'
      }
      className={`af-pulsar relative flex h-11 w-11 items-center justify-center rounded-xl bg-hearth-oat text-hearth-espresso transition-colors hover:text-hearth-terracotta-ink sm:h-10 sm:w-10 dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:hover:text-hearth-night-terracotta ${FOCO}`}
    >
      <ShoppingBag size={18} aria-hidden="true" />
      {cantidadCarrito > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-hearth-terracotta-deep px-1 text-[10px] font-extrabold tabular-nums text-white ring-2 ring-hearth-cream dark:bg-hearth-night-terracotta dark:text-hearth-night dark:ring-hearth-night">
          {cantidadCarrito > 9 ? '9+' : cantidadCarrito}
        </span>
      )}
    </button>

    {!compacto && (hayUsuario && cargandoRol ? null : !hayUsuario ? (
      <Link
        to="/entrar"
        className={`af-pulsar ml-1 inline-flex items-center rounded-xl bg-hearth-terracotta-deep px-4 py-2.5 text-[13px] font-bold text-white shadow-warm transition-colors hover:bg-hearth-terracotta-ink dark:bg-hearth-night-terracotta dark:text-hearth-night dark:hover:bg-[#F6A184] ${FOCO}`}
      >
        Entrar
      </Link>
    ) : (
      <>
        {rol === 'restaurante' && (
          <Link
            to="/panel"
            className={`af-pulsar inline-flex items-center gap-2 rounded-xl bg-hearth-oat px-4 py-2.5 text-[13px] font-bold text-hearth-espresso transition-colors hover:text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:hover:text-hearth-night-terracotta ${FOCO}`}
          >
            Mi panel
          </Link>
        )}

        <MenuCuenta />
      </>
    ))}
  </div>
);

/**
 * La barra de Descubrir.
 *
 * Una sola fila en móvil: marca, buscador y carrito. El logo vuelve al inicio;
 * el buscador es el producto y está siempre a un toque; el carrito es la única
 * acción de compra. En escritorio se añaden las secciones y la cuenta. La barra
 * se queda arriba con un material casi opaco para que el contenido pase por
 * debajo sin perder legibilidad.
 */
export const BarraDescubrir: React.FC<BarraDescubrirProps> = ({
  consulta,
  onConsulta,
  onCarrito,
  cantidadCarrito,
  onInicio,
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
    <header className="sticky top-0 z-40 border-b border-hearth-line/60 bg-hearth-cream pt-[env(safe-area-inset-top)] dark:border-hearth-night-line/70 dark:bg-hearth-night lg:bg-hearth-cream/85 lg:backdrop-blur-xl lg:dark:bg-hearth-night/85">
      <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-2 sm:gap-3 sm:px-6 sm:py-2.5 lg:px-8">
        <Link
          to="/"
          onClick={() => onInicio?.()}
          aria-label="TukiTuki, ir al inicio"
          className={`af-pulsar -m-1 flex shrink-0 items-center gap-2 rounded-xl p-1 sm:gap-2.5 ${FOCO}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-af-accent-solid text-white shadow-warm sm:h-10 sm:w-10">
            <SimboloTuki size={34} className="h-8 w-8 sm:h-9 sm:w-9" />
          </span>

          <span className="hidden min-[480px]:block">
            <span className="sm:hidden">
              <PalabraTuki
                nombre="TukiTuki"
                tamano={20}
                className="text-hearth-espresso dark:text-hearth-night-ink"
              />
            </span>
            <span className="hidden sm:block">
              <PalabraTuki
                nombre="TukiTuki"
                tamano={26}
                className="text-hearth-espresso dark:text-hearth-night-ink"
              />
            </span>
          </span>
        </Link>

        <nav aria-label="Secciones" className="hidden items-center gap-0.5 lg:flex">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-xl px-2.5 py-2 text-[13px] font-bold transition-colors ${FOCO} ${
                isActive
                  ? 'bg-hearth-terracotta-soft text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink'
                  : 'text-hearth-pebble hover:text-hearth-espresso dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink'
              }`
            }
          >
            Inicio
          </NavLink>
          <NavLink
            to="/descubrir"
            className={({ isActive }) =>
              `rounded-xl px-2.5 py-2 text-[13px] font-bold transition-colors ${FOCO} ${
                isActive
                  ? 'bg-hearth-terracotta-soft text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink'
                  : 'text-hearth-pebble hover:text-hearth-espresso dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink'
              }`
            }
          >
            Descubrir
          </NavLink>
          <Link
            to="/para-restaurantes"
            className={`rounded-xl px-2.5 py-2 text-[13px] font-bold text-hearth-pebble transition-colors hover:text-hearth-espresso dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink ${FOCO}`}
          >
            Para restaurantes
          </Link>
        </nav>

        <form
          role="search"
          className="relative min-w-0 flex-1 sm:max-w-xl"
          onSubmit={(evento) => evento.preventDefault()}
        >
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hearth-pebble dark:text-hearth-night-pebble"
          />
          <input
            id="buscador-descubrir"
            type="search"
            value={consulta}
            onChange={(evento) => onConsulta(evento.target.value)}
            placeholder="Buscar"
            aria-label="Buscar platos, restaurantes o cocinas"
            autoComplete="off"
            enterKeyHint="search"
            className="h-11 w-full appearance-none rounded-full bg-hearth-oat pl-9 pr-9 text-[16px] text-hearth-espresso outline-none transition-colors placeholder:text-hearth-pebble focus:bg-hearth-card focus:ring-2 focus:ring-hearth-terracotta/45 sm:rounded-2xl sm:pl-10 sm:text-[15px] dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:placeholder:text-hearth-night-pebble dark:focus:bg-hearth-night-card dark:focus:ring-hearth-night-terracotta/40 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {consulta && (
            <button
              type="button"
              onClick={() => onConsulta('')}
              aria-label="Borrar la búsqueda"
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-hearth-pebble transition-colors hover:text-hearth-espresso dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink ${FOCO}`}
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </form>

        <div className="sm:hidden">{acciones(true)}</div>
        <div className="hidden sm:block">{acciones(false)}</div>
      </div>
    </header>
  );
};
