/**
 * Reglas de las fotos que sube un comensal.
 *
 * La foto se comprime en el navegador y se publica en Supabase Storage, en el
 * bucket `resenas`. La base de datos solo guarda la URL resultante
 * (`valoraciones.foto_url`), así que las reglas de tamaño y de tipo viven aquí
 * para poder probarlas sin tocar la red.
 */

/** Tope de subida: por encima de esto la espera en un móvil no compensa. */
export const MAX_FOTO_MB = 8;

/** Tipos de imagen que acepta el bucket `resenas`. */
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export interface ArchivoDeImagen {
  type: string;
  size: number;
}

/**
 * Devuelve el primer problema de la foto o `null` si se puede subir.
 *
 * El mensaje se pinta tal cual bajo el selector, así que habla de megas y de
 * formatos, no de MIME types.
 */
export const validarFoto = (archivo: ArchivoDeImagen): string | null => {
  if (!archivo.type.startsWith('image/')) {
    return 'Elige una imagen: JPG, PNG o WebP.';
  }

  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return 'Ese formato no lo podemos leer. Prueba con JPG, PNG o WebP.';
  }

  if (archivo.size > MAX_FOTO_MB * 1024 * 1024) {
    return `La foto pesa demasiado. El máximo es ${MAX_FOTO_MB} MB.`;
  }

  if (archivo.size === 0) {
    return 'La foto llegó vacía. Elige otra.';
  }

  return null;
};
