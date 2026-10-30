
/**
 * Descripción: Definición de variables de entorno y constantes globales del sistema.
 */

// Función segura para leer variables de entorno con fallback
const getEnv = (key: string, fallback: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    console.warn(`Error leyendo variable ${key}`, e);
  }
  return fallback;
};

// Configuración de claves API y servicios externos
// Todas las variables deben estar definidas en .env.local
export const ENV = {
  SUPABASE_URL: getEnv("VITE_SUPABASE_URL", ""),
  SUPABASE_ANON_KEY: getEnv("VITE_SUPABASE_ANON_KEY", ""),

  // Ruta del AI Gateway. Por defecto es el mismo origen (`/api`), que Vite
  // redirige en desarrollo y Nginx/Ingress en Docker y Kubernetes. La clave de
  // Groq vive solo en el servidor.
  AI_GATEWAY_URL: getEnv("VITE_AI_GATEWAY_URL", "/api")
};

// Límites de caracteres estandarizados para todos los formularios
export const LIMITES = { 
  REST_NOMBRE: 50, 
  REST_ESLOGAN: 100, 
  REST_DESC: 500, 
  REST_EMAIL: 100,
  REST_TELEFONO: 10, // Actualizado a 10 dígitos exactos
  REST_DIRECCION: 120,
  REST_CIUDAD: 50,
  REST_DEPARTAMENTO: 60, // "Archipiélago de San Andrés, Providencia y Santa Catalina"
  REST_MUNICIPIO: 80,
  REST_URL: 200, // Facebook, Instagram
  
  PLATILLO_NOMBRE: 60, 
  PLATILLO_DESC: 250, 
  PLATILLO_CAT: 50, 
  INGREDIENTES: 300,
  
  ADDR_NUM: 10, 
  ADDR_TEXT: 50 
};

// Opciones de configuración visual
export const FUENTES = [
  { nombre: 'Playfair Display', valor: 'Playfair Display' },
  { nombre: 'Inter', valor: 'Inter' },
  { nombre: 'Roboto', valor: 'Roboto' },
  { nombre: 'Open Sans', valor: 'Open Sans' },
  { nombre: 'Lato', valor: 'Lato' },
  { nombre: 'Montserrat', valor: 'Montserrat' },
];

export const DIAS_SEMANA = [
  { key: 'lunes', label: 'Lun' },
  { key: 'martes', label: 'Mar' },
  { key: 'miercoles', label: 'Mié' },
  { key: 'jueves', label: 'Jue' },
  { key: 'viernes', label: 'Vie' },
  { key: 'sabado', label: 'Sáb' },
  { key: 'domingo', label: 'Dom' },
];
