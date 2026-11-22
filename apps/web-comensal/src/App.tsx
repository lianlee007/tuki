import React, { Suspense, lazy } from 'react';
// @ts-ignore
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import {
  ChatRecomendador,
  ErrorBoundary,
  Logo,
  PaginaAutenticacion,
  PaginaDescubrir,
  PaginaEntrar,
  PaginaInspiracion,
  PaginaMiCuenta,
  PaginaParaRestaurantes,
  PaginaPrivacidad,
  PaginaQR,
  PaginaTerminos,
  Pagina404,
  ProveedorAutenticacion,
  ProveedorTema,
  RutaAuth,
  RutaConSesion,
  SincronizacionCarrito,
  TransicionPagina,
  VistaPublica,
} from '@tuki/experiencia';
import './estilos.css';
import '@tuki/experiencia/estilos/tokens.css';
import '@tuki/experiencia/estilos/sistema-visual.css';

const PantallaCarga = () => (
  <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 animate-fadeIn">
    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white animate-bounce">
      <Logo size={46} />
    </div>
    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
      Cargando TukiTuki...
    </span>
  </div>
);

const ContenidoAnimado = () => {
  const location = useLocation();

  return (
    <ErrorBoundary key={location.pathname}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<TransicionPagina><PaginaDescubrir /></TransicionPagina>} />
          <Route path="/explorar" element={<TransicionPagina><PaginaDescubrir /></TransicionPagina>} />
          <Route path="/descubrir" element={<RutaConSesion><TransicionPagina><PaginaInspiracion /></TransicionPagina></RutaConSesion>} />
          <Route path="/inspiracion" element={<RutaConSesion><TransicionPagina><PaginaInspiracion /></TransicionPagina></RutaConSesion>} />
          <Route path="/para-restaurantes" element={<TransicionPagina><PaginaParaRestaurantes /></TransicionPagina>} />
          <Route path="/auth" element={<RutaAuth><TransicionPagina><PaginaAutenticacion /></TransicionPagina></RutaAuth>} />
          <Route path="/entrar" element={<RutaAuth><TransicionPagina><PaginaEntrar /></TransicionPagina></RutaAuth>} />
          <Route path="/mi-cuenta" element={<RutaConSesion><TransicionPagina><PaginaMiCuenta /></TransicionPagina></RutaConSesion>} />
          <Route path="/restaurante/:slug" element={<TransicionPagina><VistaPublica /></TransicionPagina>} />
          <Route path="/terminos" element={<TransicionPagina><PaginaTerminos /></TransicionPagina>} />
          <Route path="/privacidad" element={<TransicionPagina><PaginaPrivacidad /></TransicionPagina>} />
          <Route path="/qr" element={<TransicionPagina><PaginaQR /></TransicionPagina>} />
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
        <SincronizacionCarrito />
        <ProveedorTema>
          <Router>
            <Suspense fallback={<PantallaCarga />}>
              <ContenidoAnimado />
            </Suspense>
            <ChatRecomendador />
          </Router>
        </ProveedorTema>
      </ProveedorAutenticacion>
    </HelmetProvider>
  );
}
