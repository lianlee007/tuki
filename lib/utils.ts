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
 * Genera un slug único agregando el ID para garantizar permanencia
 * El ID asegura que el QR y las URLs sigan funcionando aunque cambie el nombre
 * Formato: "nombre-restaurante-abc12345" (primeros 8 caracteres del ID)
 */
export const generarSlugUnico = (nombre: string, id: string): string => {
  const slugBase = generarSlug(nombre);
  // Si el slug está vacío, usar el ID completo
  if (!slugBase) return id;
  // Combinar nombre con ID para garantizar permanencia: "el-dragon-5a9aa71d"
  // El ID nunca cambia, así que el QR será permanente
  return `${slugBase}-${id.slice(0, 8)}`;
};

