/** Convierte un nombre visible en un slug estable y legible. */
export const generarSlug = (nombre: string): string =>
  nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'restaurante';
