import React, { Suspense } from 'react';
// @ts-ignore
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import {
  ErrorBoundary,
  Logo,
  PaginaAutenticacion,
  PaginaEntrar,
  PanelControl,
  Pagina404,
  ProveedorAutenticacion,
  ProveedorTema,
  RutaAuth,
  RutaPanel,
  TransicionPagina,
  VistaPublica,
} from '@tuki/experiencia';
import './estilos.css';
import '@tuki/experiencia/estilos/tokens.css';
import '@tuki/experiencia/estilos/apple-tokens.css';

const PantallaCarga = () => (
  <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 animate-fadeIn">
    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white animate-bounce">
      <Logo size={46} />
    </div>
    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
      Cargando TukiTuki Panel...
    </span>
  </div>
);

const ContenidoAnimado = () => {
  const location = useLocation();

  return (
    <ErrorBoundary key={location.pathname}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/panel" replace />} />
          {/* Enlaces antiguos del sitio público que llegaban a la landing de
              restaurantes: en el panel no existe, así que vuelven a su inicio. */}
          <Route path="/para-restaurantes" element={<Navigate to="/panel" replace />} />
          <Route path="/auth" element={<RutaAuth><TransicionPagina><PaginaAutenticacion volverA="/panel" /></TransicionPagina></RutaAuth>} />
          <Route path="/entrar" element={<RutaAuth><TransicionPagina><PaginaEntrar volverA="/panel" /></TransicionPagina></RutaAuth>} />
          <Route path="/panel" element={<RutaPanel><TransicionPagina><PanelControl /></TransicionPagina></RutaPanel>} />
          <Route path="/restaurante/:slug" element={<TransicionPagina><VistaPublica /></TransicionPagina>} />
          <Route path="*" element={<Pagina404 />} />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <ProveedorAutenticacion>
        <ProveedorTema>
          <Router>
            <Suspense fallback={<PantallaCarga />}>
              <ContenidoAnimado />
            </Suspense>
          </Router>
        </ProveedorTema>
      </ProveedorAutenticacion>
    </HelmetProvider>
  );
}
