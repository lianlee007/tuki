import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ProveedorAuth } from '@tuki/auth-react';
import './estilos-admin.css';
import { apis } from './apis';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProveedorAuth apis={apis}>
        <App />
      </ProveedorAuth>
    </BrowserRouter>
  </React.StrictMode>,
);
