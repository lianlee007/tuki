import { Navigate, Route, Routes } from 'react-router-dom';
import { RutaSuperadmin } from './componentes/RutaSuperadmin';
import { Entrar } from './paginas/Entrar';
import { PanelAdmin } from './paginas/PanelAdmin';

export const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/admin" replace />} />
    <Route path="/entrar" element={<Entrar />} />
    <Route
      path="/admin"
      element={
        <RutaSuperadmin>
          <PanelAdmin />
        </RutaSuperadmin>
      }
    />
    <Route path="*" element={<Navigate to="/admin" replace />} />
  </Routes>
);
