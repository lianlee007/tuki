/**
 * Subida de imágenes a Supabase Storage.
 *
 * Sustituye a Cloudinary (ADR 0008). El navegador comprime y redimensiona
 * antes de subir; Supabase solo guarda el archivo y sirve la URL pública.
 *
 * Buckets (públicos de lectura):
 *   - `platillos`     fotos del menú del restaurante
 *   - `restaurantes`  logo y banner del local
 *   - `resenas`       fotos que adjunta un comensal
 *
 * Límites del bucket: 5 MB por archivo (8 MB en `resenas`) y solo
 * `image/jpeg`, `image/png`, `image/webp` o `image/avif`. La compresión deja
 * el archivo muy por debajo de ese tope.
 */
import { supabase } from './supabase';

export const BUCKETS = {
  platillos: 'platillos',
  restaurantes: 'restaurantes',
  resenas: 'resenas',
} as const;

export type DestinoImagen = keyof typeof BUCKETS;

/** Ancho máximo tras comprimir. Una tarjeta de menú nunca necesita más. */
const MAX_LADO_PX = 1600;

/** Calidad WebP. A 0.82 el ojo no distingue y se ahorra ~70 % frente a JPEG. */
const CALIDAD = 0.82;

/** Tipos que acepta el bucket; el resto se rechaza antes de tocar la red. */
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/** Margen del bucket para no rechazar un archivo ya comprimido. */
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Comprime y redimensiona en el navegador.
 * - Máximo 1600 px por el lado largo.
 * - Intenta WebP; si el navegador no lo soporta, cae a JPEG 0.82.
 * - Si algo falla devuelve el original: subir lento es mejor que no subir.
 */
export const comprimirImagen = (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return Promise.resolve(file);

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height && width > MAX_LADO_PX) {
          height = Math.round((height * MAX_LADO_PX) / width);
          width = MAX_LADO_PX;
        } else if (height > MAX_LADO_PX) {
          width = Math.round((width * MAX_LADO_PX) / height);
          height = MAX_LADO_PX;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);

        const terminar = (blob: Blob | null, tipo: string, extension: string) => {
          if (!blob) return resolve(file);
          resolve(
            new File([blob], file.name.replace(/\.[^/.]+$/, '') + extension, {
              type: tipo,
              lastModified: Date.now(),
            })
          );
        };

        canvas.toBlob((webp) => {
          if (webp) return terminar(webp, 'image/webp', '.webp');
          canvas.toBlob(
            (jpeg) => terminar(jpeg, 'image/jpeg', '.jpg'),
            'image/jpeg',
            CALIDAD
          );
        }, 'image/webp', CALIDAD);
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
};

/** Nombre único y estable dentro del bucket: `<carpeta>/<uuid>.<ext>`. */
const nombreObjeto = (destino: DestinoImagen, archivo: File) => {
  const extension = archivo.type === 'image/webp' ? 'webp' : 'jpg';
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${destino}/${id}.${extension}`;
};

/**
 * Comprime y sube la imagen. Devuelve su URL pública.
 *
 * Lanza un `Error` con mensaje en español: los formularios lo pintan tal cual.
 */
export const subirImagen = async (
  file: File,
  destino: DestinoImagen = 'platillos'
): Promise<string> => {
  if (!TIPOS_IMAGEN.includes(file.type)) {
    throw new Error('Elige una imagen JPG, PNG, WebP o AVIF.');
  }

  const optimizada = await comprimirImagen(file);

  if (optimizada.size > MAX_BYTES) {
    throw new Error('La imagen sigue pesando más de 5 MB después de comprimirla.');
  }

  const ruta = nombreObjeto(destino, optimizada);
  const { error } = await supabase.storage
    .from(BUCKETS[destino])
    .upload(ruta, optimizada, {
      contentType: optimizada.type,
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) {
    throw new Error(`No se pudo subir la imagen: ${error.message}`);
  }

  return supabase.storage.from(BUCKETS[destino]).getPublicUrl(ruta).data.publicUrl;
};
