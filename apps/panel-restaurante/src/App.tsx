import { Navigate, Route, Routes } from 'react-router-dom';
import { RutaProtegida } from '@tuki/auth-react';
import { Entrar } from './paginas/Entrar';
import { Panel } from './paginas/Panel';

export const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/panel" replace />} />
    <Route path="/entrar" element={<Entrar />} />
    <Route
      path="/panel"
      element={
        <RutaProtegida roles={['dueno', 'superadmin']}>
          <Panel />
        </RutaProtegida>
      }
    />
    <Route path="*" element={<Navigate to="/panel" replace />} />
  </Routes>
);
