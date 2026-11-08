import { Navigate, Route, Routes } from 'react-router-dom';
import { RutaProtegida } from '@tuki/auth-react';
import { Entrar } from './paginas/Entrar';
import { PanelAdmin } from './paginas/PanelAdmin';

export const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/admin" replace />} />
    <Route path="/entrar" element={<Entrar />} />
    <Route
      path="/admin"
      element={
        <RutaProtegida roles={['superadmin']}>
          <PanelAdmin />
        </RutaProtegida>
      }
    />
    <Route path="*" element={<Navigate to="/admin" replace />} />
  </Routes>
);
