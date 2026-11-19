/**
 * Subida de imágenes al servicio de medios (RustFS / S3).
 *
 * El navegador comprime y redimensiona antes de subir; el servicio valida el
 * tipo y el tamaño, guarda el objeto y devuelve su URL pública.
 *
 * Destinos:
 *   - `platillos`     fotos del menú del restaurante
 *   - `restaurantes`  logo y banner del local
 *   - `resenas`       fotos que adjunta un comensal
 */
import { apis } from './api-tuki';
import { ErrorHttp } from '@tuki/api-cliente';

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

  try {
    const subida = await apis.media.subir(optimizada, destino);
    return subida.url;
  } catch (error) {
    // El revisor de fotos ya trae un mensaje pensado para el dueño.
    if (error instanceof ErrorHttp && error.codigo === 'imagen_no_comida') {
      throw new Error(error.message);
    }
    const mensaje = error instanceof Error ? error.message : 'error desconocido';
    throw new Error(`No se pudo subir la imagen: ${mensaje}`);
  }
};
