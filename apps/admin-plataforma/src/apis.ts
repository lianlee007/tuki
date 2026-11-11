import { crearApis } from '@tuki/api-cliente';

const env = import.meta.env;

/** Configuración inyectada por Kubernetes en `/config.js`. */
const runtime =
  (globalThis as { __TUKI_CONFIG__?: Record<string, string | undefined> })
    .__TUKI_CONFIG__ ?? {};

const url = (clave: string, variable: string, defecto: string): string =>
  runtime[clave] ?? env[variable] ?? defecto;

/** URL del sitio público para abrir la ficha de un restaurante. */
export const urlSitioPublico = url(
  'web',
  'VITE_WEB_URL',
  'http://localhost:5173',
).replace(/\/+$/, '');

/** Cliente único de la app de administración. */
export const apis = crearApis({
  urls: {
    identidad: url('identidad', 'VITE_IDENTIDAD_URL', 'http://localhost:3001'),
    restaurantes: url('restaurantes', 'VITE_RESTAURANTES_URL', 'http://localhost:3002'),
    media: url('media', 'VITE_MEDIA_URL', 'http://localhost:3003'),
    pedidos: url('pedidos', 'VITE_PEDIDOS_URL', 'http://localhost:3004'),
    resenas: url('resenas', 'VITE_RESENAS_URL', 'http://localhost:3005'),
    admin: url('admin', 'VITE_ADMIN_URL', 'http://localhost:3006'),
  },
  obtenerToken: () => localStorage.getItem('tuki.access'),
});
