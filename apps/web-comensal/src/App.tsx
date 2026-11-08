import { Link, Route, Routes } from 'react-router-dom';
import { RutaProtegida } from '@tuki/auth-react';
import { Inicio } from './paginas/Inicio';
import { Ficha } from './paginas/Ficha';
import { Entrar } from './paginas/Entrar';
import { MisPedidos } from './paginas/MisPedidos';
import { NoEncontrada } from './paginas/NoEncontrada';

export const App = () => (
  <Routes>
    <Route path="/" element={<Inicio />} />
    <Route path="/restaurante/:slug" element={<Ficha />} />
    <Route path="/entrar" element={<Entrar />} />
    <Route
      path="/mi-cuenta"
      element={
        <RutaProtegida>
          <MisPedidos />
        </RutaProtegida>
      }
    />
    <Route path="*" element={<NoEncontrada />} />
    <Route path="/para-restaurantes" element={<RedirigirPanel />} />
  </Routes>
);

const RedirigirPanel = () => (
  <main className="tuki-main">
    <h1 className="tuki-titulo">¿Tienes un restaurante?</h1>
    <p className="tuki-subtitulo">
      El panel del dueño vive en <Link to="http://localhost:5174">localhost:5174</Link>.
    </p>
  </main>
);
