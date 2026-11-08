import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ProveedorAuth } from '@tuki/auth-react';
import '@tuki/ui-kit/estilos.css';
import { apis } from './apis';
import { App } from './App';
import { ProveedorCarrito } from './carrito/contexto';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProveedorAuth apis={apis}>
        <ProveedorCarrito>
          <App />
        </ProveedorCarrito>
      </ProveedorAuth>
    </BrowserRouter>
  </React.StrictMode>,
);
