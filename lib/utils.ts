/**
 * Utilidades generales del sistema
 */

/**
 * Genera un slug (URL amigable) a partir de un texto
 * Ejemplo: "La Pizzería Mía" -> "la-pizzeria-mia"
 */
export const generarSlug = (texto: string): string => {
  return texto
    .toLowerCase()
    .normalize('NFD') // Normaliza caracteres especiales
    .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Elimina caracteres especiales
    .replace(/\s+/g, '-') // Reemplaza espacios con guiones
    .replace(/-+/g, '-') // Elimina guiones múltiples
    .replace(/^-|-$/g, ''); // Elimina guiones al inicio y final
};

/**
 * Genera un slug único agregando el ID si es necesario
 * Esto asegura que cada restaurante tenga un slug único
 */
export const generarSlugUnico = (nombre: string, id: string): string => {
  const slugBase = generarSlug(nombre);
  // Si el slug está vacío, usar el ID
  if (!slugBase) return id;
  // Combinar slug con ID para garantizar unicidad: "la-pizzeria-mia-abc123"
  return `${slugBase}-${id.slice(0, 8)}`;
};

