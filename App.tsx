/**
 * Descripción: Configuración principal de enrutamiento y proveedores de contexto de la aplicación.
 */
import React, { Suspense, lazy } from 'react';
// @ts-ignore
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { ProveedorAutenticacion } from './contexto/ContextoAutenticacion';
import { ProveedorTema } from './contexto/ContextoTema';
import { RutaPanel, RutaAuth } from './componentes/rutas/RutasProtegidas';
import { Logo } from './componentes/ui';
import { TransicionPagina } from './componentes/sistema-diseno/TransicionPagina';
import { ErrorBoundary } from './componentes/sistema-diseno/ErrorBoundary';
import { SincronizacionCarrito } from './componentes/SincronizacionCarrito';

// --- LAZY LOADING (Carga Diferida) ---
const PaginaDescubrir = lazy(() => import('./paginas/PaginaDescubrir'));
const PaginaParaRestaurantes = lazy(() => import('./paginas/PaginaParaRestaurantes'));
const PaginaAutenticacion = lazy(() => import('./paginas/PaginaAutenticacion'));
const PaginaEntrar = lazy(() => import('./paginas/PaginaEntrar'));
const PanelControl = lazy(() => import('./paginas/PanelControl'));
const VistaPublica = lazy(() => import('./paginas/VistaPublica'));
const PaginaTerminos = lazy(() => import('./paginas/PaginaTerminos'));
const PaginaPrivacidad = lazy(() => import('./paginas/PaginaPrivacidad'));
const PaginaQR = lazy(() => import('./paginas/PaginaQR'));
const Pagina404 = lazy(() => import('./paginas/Pagina404'));

// Componente de carga
const PantallaCarga = () => (
  <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 animate-fadeIn">
    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white animate-bounce">
      <Logo size={40} />
    </div>
    <div className="flex flex-col items-center gap-2">
      <div className="h-1.5 w-32 bg-surface rounded-full overflow-hidden">
        <div className="h-full bg-primary w-1/2 animate-[shimmer_1s_infinite_linear] rounded-full"></div>
      </div>
      <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Cargando Riki...</span>
    </div>
  </div>
);

// Componente interno para manejar la ubicación y las animaciones
const ContenidoAnimado = () => {
  const location = useLocation();

  return (
    <ErrorBoundary key={location.pathname}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<TransicionPagina><PaginaDescubrir /></TransicionPagina>} />
          <Route path="/explorar" element={<TransicionPagina><PaginaDescubrir /></TransicionPagina>} />
          <Route path="/para-restaurantes" element={<TransicionPagina><PaginaParaRestaurantes /></TransicionPagina>} />
          <Route path="/auth" element={<RutaAuth><TransicionPagina><PaginaAutenticacion /></TransicionPagina></RutaAuth>} />
          <Route path="/entrar" element={<RutaAuth><TransicionPagina><PaginaEntrar /></TransicionPagina></RutaAuth>} />
          <Route path="/panel" element={<RutaPanel><TransicionPagina><PanelControl /></TransicionPagina></RutaPanel>} />
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
          </Router>
        </ProveedorTema>
      </ProveedorAutenticacion>
    </HelmetProvider>
  );
}