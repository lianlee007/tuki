import React from 'react';
import { Navigate } from 'react-router-dom';
import type { Rol } from '@tuki/dominio';
import { usarAuth } from './contexto.js';

/** Pantalla mínima mientras se resuelve la sesión. */
const Cargando = () => (
  <div style={{ padding: 48, textAlign: 'center', fontFamily: 'system-ui' }}>
    Cargando…
  </div>
);

/** Protege una ruta y, opcionalmente, exige uno de los roles indicados. */
export const RutaProtegida: React.FC<{
  roles?: Rol[];
  children: React.ReactNode;
}> = ({ roles, children }) => {
  const { usuario, cargando } = usarAuth();

  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/entrar" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />;

  return <>{children}</>;
};
