import { crearApis } from '@tuki/api-cliente';

const env = import.meta.env;

/** Cliente único del panel; comparte el almacén de sesión con la app. */
export const apis = crearApis({
  urls: {
    identidad: env.VITE_IDENTIDAD_URL ?? 'http://localhost:3001',
    restaurantes: env.VITE_RESTAURANTES_URL ?? 'http://localhost:3002',
    media: env.VITE_MEDIA_URL ?? 'http://localhost:3003',
    pedidos: env.VITE_PEDIDOS_URL ?? 'http://localhost:3004',
    resenas: env.VITE_RESENAS_URL ?? 'http://localhost:3005',
  },
  obtenerToken: () => localStorage.getItem('tuki.access'),
});
