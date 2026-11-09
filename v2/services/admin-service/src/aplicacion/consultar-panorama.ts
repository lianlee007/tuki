import type { Panorama } from '../dominio/admin.js';
import type { ServiciosRemotos } from '../puertos/servicios.remotos.js';

/** Caso de uso: resumen global de usuarios, locales y pedidos. */
export const consultarPanorama =
  ({ remotos }: { remotos: ServiciosRemotos }) =>
  (token: string): Promise<Panorama> =>
    remotos.panorama(token);
