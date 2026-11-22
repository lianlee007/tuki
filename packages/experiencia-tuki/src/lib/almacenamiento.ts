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
export const comprimirImagen = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;

  /* Decodificar con `createImageBitmap` (fuera del hilo principal) y sin pasar
     por un data URL: una foto de 12 MP en un móvil podía reventar la pestaña
     entre la cadena base64 y el `<img>` a tamaño completo. El canvas final
     nunca pasa de 1600 px por el lado largo. */
  let bitmap: ImageBitmap | null = null;
  try {
    if (typeof createImageBitmap === 'function') bitmap = await createImageBitmap(file);
  } catch {
    bitmap = null;
  }

  let url: string | null = null;
  let imagen: HTMLImageElement | null = null;
  try {
    if (!bitmap) {
      url = URL.createObjectURL(file);
      imagen = await new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url as string;
      });
    }

    const fuente: CanvasImageSource | null = bitmap ?? imagen;
    const anchoFuente = bitmap?.width ?? imagen?.naturalWidth ?? 0;
    const altoFuente = bitmap?.height ?? imagen?.naturalHeight ?? 0;
    if (!fuente || !anchoFuente || !altoFuente) return file;

    let ancho = anchoFuente;
    let alto = altoFuente;
    if (ancho > alto && ancho > MAX_LADO_PX) {
      alto = Math.round((alto * MAX_LADO_PX) / ancho);
      ancho = MAX_LADO_PX;
    } else if (alto > MAX_LADO_PX) {
      ancho = Math.round((ancho * MAX_LADO_PX) / alto);
      alto = MAX_LADO_PX;
    }

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(fuente, 0, 0, ancho, alto);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', CALIDAD);
    });
    if (!blob) return file;

    return new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    bitmap?.close();
    if (url) URL.revokeObjectURL(url);
  }
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
