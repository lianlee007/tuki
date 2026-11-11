import React, { PropsWithChildren } from 'react';
// @ts-ignore
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type Rol } from '../../contexto/ContextoAutenticacion';
import { Logo } from '../ui';

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

const inicioDe = (rol: Rol) => (rol === 'restaurante' ? '/panel' : '/');

/**
 * A dónde vuelve una cuenta recién autenticada. `?volver=` solo acepta rutas
 * internas: una URL absoluta convertiría el login en un redirector abierto.
 */
const destino = (busqueda: string, rol: Rol) => {
  const volver = new URLSearchParams(busqueda).get('volver');
  if (volver && volver.startsWith('/') && !volver.startsWith('//')) return volver;
  return inicioDe(rol);
};

/** Solo el dueño de un restaurante entra al panel. Un comensal vuelve a la portada. */
export function RutaPanel({ children }: PropsWithChildren) {
  const { user, loading, rol, cargandoRol } = useAuth();

  if (loading) return <PantallaCarga />;
  if (!user) return <Navigate to="/auth" replace />;
  if (cargandoRol || rol === null) return <PantallaCarga />;
  if (rol !== 'restaurante') return <Navigate to="/" replace />;

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
export function RutaAuth({ children }: PropsWithChildren) {  const { user, loading, rol, cargandoRol } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <>{children}</>;
  if (cargandoRol || rol === null) return <PantallaCarga />;

  return <Navigate to={destino(location.search, rol)} replace />;
}
