import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usarAuth } from '@tuki/auth-react';
import { CargandoPantalla } from './ui';

/**
 * Protege la consola. A diferencia de `RutaProtegida`, una sesión sin el rol
 * correcto vuelve al acceso en lugar de entrar en un bucle de redirecciones.
 */
export const RutaSuperadmin = ({ children }: { children: ReactNode }) => {
  const { usuario, cargando } = usarAuth();

  if (cargando) return <CargandoPantalla />;
  if (!usuario || usuario.rol !== 'superadmin') {
    return <Navigate to="/entrar" replace />;
  }

  return <>{children}</>;
};
