import React, { PropsWithChildren, useEffect } from 'react';
// @ts-ignore
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type Rol } from '../../contexto/ContextoAutenticacion';
import { Logo } from '../ui';
import { urlComensal, urlPanelRestaurante } from '../../lib/api-tuki';

const PantallaCarga = () => (
  <div className="flex min-h-screen items-center justify-center bg-af-ground">
    <div className="flex animate-pulse items-center gap-2 text-af-ink-secondary">
      <span className="rounded-xl bg-af-accent-solid p-2 text-white">
        <Logo size={18} />
      </span>
      <span className="text-[13px] font-semibold">Un momento…</span>
    </div>
  </div>
);

const inicioDe = (rol: Rol) => {
  if (rol !== 'restaurante') return '/';

  const panel = urlPanelRestaurante();
  if (typeof window !== 'undefined') {
    try {
      // En el propio panel la ruta es interna; en el sitio público es otro
      // origen y hay que salir con una recarga completa.
      if (new URL(panel, window.location.origin).origin === window.location.origin) {
        return '/panel';
      }
    } catch {
      // Si la URL configurada no es válida, se devuelve tal cual.
    }
  }
  return panel;
};

/**
 * A dónde vuelve una cuenta recién autenticada. `?volver=` solo acepta rutas
 * internas: una URL absoluta convertiría el login en un redirector abierto.
 */
const destino = (busqueda: string, rol: Rol) => {
  const volver = new URLSearchParams(busqueda).get('volver');
  if (volver && volver.startsWith('/') && !volver.startsWith('//')) return volver;
  return inicioDe(rol);
};

/**
 * Pantalla para quien entró al panel con una cuenta que no gestiona un
 * restaurante. Antes se redirigía a «/», que en el panel vuelve al mismo
 * guardia y termina en un bucle de navegación.
 */
const CuentaSinPanel: React.FC<{ rol: Rol | null }> = ({ rol }) => {
  const { cerrarSesion } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-af-ground px-6 text-center">
      <span className="rounded-2xl bg-af-accent-solid p-3 text-white">
        <Logo size={22} />
      </span>
      <h1 className="text-lg font-bold text-af-ink">
        Esta cuenta no gestiona un restaurante
      </h1>
      <p className="max-w-sm text-[13px] leading-relaxed text-af-ink-secondary">
        {rol === 'cliente'
          ? 'Entraste con una cuenta de comensal.'
          : 'Esta cuenta no tiene acceso al panel.'}{' '}
        Para pedir comida sigue en TukiTuki; para administrar un menú entra con la
        cuenta del restaurante.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <a
          href={urlComensal()}
          className="rounded-xl bg-af-accent-solid px-4 py-2.5 text-[13px] font-bold text-white"
        >
          Ir a TukiTuki
        </a>
        <button
          type="button"
          onClick={() => void cerrarSesion()}
          className="rounded-xl border border-black/10 bg-af-surface px-4 py-2.5 text-[13px] font-bold text-af-ink"
        >
          Entrar con otra cuenta
        </button>
      </div>
    </div>
  );
};

/** Solo el dueño de un restaurante entra al panel. Un comensal vuelve a la portada. */
export function RutaPanel({ children }: PropsWithChildren) {
  const { user, loading, rol, cargandoRol } = useAuth();

  if (loading) return <PantallaCarga />;
  if (!user) return <Navigate to="/auth" replace />;
  if (cargandoRol || rol === null) return <PantallaCarga />;
  // Un comensal aquí no tiene a dónde ir: redirigir a «/» lo devolvía a esta
  // misma ruta y el navegador acababa bloqueando la navegación (pantalla en
  // blanco). Se le muestra la salida y no se mueve de sitio.
  if (rol !== 'restaurante') return <CuentaSinPanel rol={rol} />;

  return <>{children}</>;
}

/**
 * Páginas que necesitan una cuenta para tener sentido. «Mi cuenta» y la baraja
 * de Descubrir comparten la misma regla: sin sesión se vuelve al acceso con la
 * ruta de origen, para que al entrar se retome donde estaba.
 */
export function RutaConSesion({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PantallaCarga />;
  if (!user) {
    const volver = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/entrar?volver=${volver}`} replace />;
  }

  return <>{children}</>;
}

/** «Mi cuenta» es de cualquier persona con sesión. */
export const RutaCuenta = RutaConSesion;

/**
 * Páginas de acceso. Si ya hay sesión no se muestra el formulario: cada papel
 * va a su casa (el panel o la portada) o a la ruta de la que venía.
 */
const RedireccionExterna: React.FC<{ url: string }> = ({ url }) => {
  useEffect(() => {
    window.location.replace(url);
  }, [url]);
  return <PantallaCarga />;
};

export function RutaAuth({ children }: PropsWithChildren) {  const { user, loading, rol, cargandoRol } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <>{children}</>;
  if (cargandoRol || rol === null) return <PantallaCarga />;

  const irA = destino(location.search, rol);
  if (/^https?:\/\//i.test(irA)) return <RedireccionExterna url={irA} />;

  return <Navigate to={irA} replace />;
}
