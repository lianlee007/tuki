/**
 * Descripción: servicios externos de TukiTuki.
 *
 * La IA pasa por el gateway local (Ollama) y las imágenes por el almacenamiento
 * del proyecto. La subida vive en `almacenamiento.ts`; aquí se reexporta para
 * no tocar los formularios.
 */
import { generarTextoIA } from './servicioIA';

export { subirImagen } from './almacenamiento';

// --- SERVICIO DE IA ---

export const generarContenidoIA = async (
  prompt: string,
  sistema: string = 'Eres un experto en marketing gastronómico.'
) => {
  try {
    return await generarTextoIA(prompt, sistema);
  } catch (error) {
    console.error('Error generando contenido IA:', error);
    throw error;
  }
};
