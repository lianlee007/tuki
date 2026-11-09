/**
 * Descripción: servicios externos de Tuki.
 *
 * La IA pasa por Groq y las imágenes por Supabase Storage. La subida vive en
 * `almacenamiento.ts`; aquí se reexporta para no tocar los formularios.
 */
import { generarContenidoGroq } from './servicioGroq';

export { subirImagen } from './almacenamiento';

// --- SERVICIO DE IA ---

export const generarContenidoIA = async (
  prompt: string,
  sistema: string = 'Eres un experto en marketing gastronómico.'
) => {
  try {
    return await generarContenidoGroq(prompt, sistema);
  } catch (error) {
    console.error('Error generando contenido IA:', error);
    throw error;
  }
};
