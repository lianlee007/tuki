/**
 * Descripción: Servicios externos para IA (Groq) y optimización/subida de imágenes (Cloudinary).
 */
import { ENV } from '../constantes';
import { generarContenidoGroq } from './servicioGroq';

// --- SERVICIO DE IA (Sin límites) ---

// Función envoltorio para llamadas a la IA sin restricciones de tasa
export const generarContenidoIA = async (prompt: string, sistema: string = "Eres un experto en marketing gastronómico.") => {
  try {
    // Llamada directa sin rate limit
    return await generarContenidoGroq(prompt, sistema);
  } catch (error) {
    console.error("Error generando contenido IA:", error);
    throw error;
  }
};

// --- SERVICIO DE IMÁGENES (Cloudinary con Compresión) ---

/**
 * Comprime y redimensiona una imagen en el cliente antes de subirla.
 * - Máximo ancho/alto: 1280px
 * - Calidad JPEG: 0.8 (80%)
 * - Convierte todo a JPEG para estandarizar
 */
const comprimirImagen = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Si no es imagen, pasar directo
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1280;

        // Redimensionar manteniendo aspecto
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Fallback si falla el contexto
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Comprimir a JPEG con calidad 0.8
        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            resolve(file); // Fallback
          }
        }, 'image/jpeg', 0.8);
      };

      img.onerror = () => resolve(file); // Fallback
    };
    
    reader.onerror = () => resolve(file); // Fallback
  });
};

export const subirImagen = async (file: File): Promise<string> => {
  try {
    // 1. Comprimir en el navegador antes de subir (Ahorra datos y tiempo)
    const archivoOptimizado = await comprimirImagen(file);

    const formData = new FormData();
    formData.append('file', archivoOptimizado);
    formData.append('upload_preset', ENV.CLOUDINARY_UPLOAD_PRESET);

    // 2. Subir a Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${ENV.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    const data = await response.json();
    
    if (data.secure_url) {
      // 3. Inyectar parámetros de optimización de entrega (f_auto, q_auto) en la URL
      // Esto asegura que al descargarla, Cloudinary sirva WebP/AVIF optimizado
      const url = data.secure_url;
      const insertIndex = url.indexOf('/upload/') + 8;
      const optimizedUrl = url.slice(0, insertIndex) + 'q_auto,f_auto/' + url.slice(insertIndex);
      
      return optimizedUrl;
    }
    
    throw new Error(data.error?.message || "Error al subir imagen");
  } catch (error) {
    console.error("Error subiendo imagen:", error);
    throw error;
  }
};