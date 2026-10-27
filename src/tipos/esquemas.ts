
import { z } from 'zod';
import { LIMITES } from '../constantes';

// --- ESQUEMAS DE VALIDACIÓN ---

/* Caracteres admitidos.
   Antes el nombre sólo aceptaba letras y espacios, así que "Tacos 3 Carnes",
   "Pizza 4 Quesos" o "Alitas (10 uds.)" eran imposibles de guardar: la carta
   real usa números y puntuación.
   Cada patrón existe dos veces: `+` para validar (no admite vacío) y `*` para
   filtrar mientras se escribe (tiene que admitir el campo vacío, o el usuario
   no podría borrar lo que escribió). La clase de caracteres vive en un solo
   sitio para que validación y filtrado no se separen nunca. */
const CLASE_NOMBRE = "a-zA-Z0-9áéíóúüÁÉÍÓÚÜñÑ\\s.,'()°ºª½¼¾&+/\\-";
const CLASE_DESC = "a-zA-Z0-9áéíóúüÁÉÍÓÚÜñÑ\\s.,;:!?¡¿\"'()%+&*/\\-";
const CLASE_INGREDIENTE = "a-zA-Z0-9áéíóúüÁÉÍÓÚÜñÑ\\s.,%'()/\\-";

/** Validación (un valor vacío no pasa). */
export const RE_PLATILLO_NOMBRE = new RegExp(`^[${CLASE_NOMBRE}]+$`);
export const RE_PLATILLO_DESC = new RegExp(`^[${CLASE_DESC}]+$`);
export const RE_INGREDIENTE = new RegExp(`^[${CLASE_INGREDIENTE}]+$`);

/** Filtrado al escribir (el valor vacío sí pasa). */
export const RE_PLATILLO_NOMBRE_TIPEO = new RegExp(`^[${CLASE_NOMBRE}]*$`);
export const RE_PLATILLO_DESC_TIPEO = new RegExp(`^[${CLASE_DESC}]*$`);
/** El textarea de ingredientes lleva comas entre ellos. */
export const RE_INGREDIENTES_TIPEO = new RegExp(`^[${CLASE_INGREDIENTE},]*$`);

/**
 * ¿Se acepta lo que el usuario acaba de escribir?
 * Deja pasar el texto nuevo si cumple el patrón, o si el texto ANTERIOR ya lo
 * incumplía (un valor que llega de la base de datos no debe quedar bloqueado
 * sólo por no encajar en el patrón de hoy).
 */
export const entradaPermitida = (nuevo: string, anterior: string, patron: RegExp): boolean =>
  patron.test(nuevo) || !patron.test(anterior);

/**
 * Deja un texto con los caracteres que el esquema acepta.
 * Se usa con lo que devuelve la IA, que a veces añade comillas de más, emoji o
 * dos puntos al final. Comparte la misma clase de caracteres que la validación,
 * así que lo que sale de aquí siempre pasa el esquema.
 */
const sanitizador = (clase: string) => (texto: string, max: number): string =>
  (texto || '')
    .replace(new RegExp(`[^${clase}]`, 'g'), '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

export const limpiarNombre = sanitizador(CLASE_NOMBRE);
export const limpiarDescripcion = sanitizador(CLASE_DESC);
export const limpiarIngrediente = sanitizador(CLASE_INGREDIENTE);

export const RestauranteSchema = z.object({
  nombre: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(LIMITES.REST_NOMBRE, `Máximo ${LIMITES.REST_NOMBRE} caracteres`),
    
  eslogan: z.string()
    .max(LIMITES.REST_ESLOGAN, `Máximo ${LIMITES.REST_ESLOGAN} caracteres`)
    .optional(),
    
  descripcion: z.string()
    .max(LIMITES.REST_DESC, `Máximo ${LIMITES.REST_DESC} caracteres`)
    .optional(),
    
  telefono: z.string()
    .regex(/^\d{10}$/, "Debe ser un número válido de 10 dígitos")
    .max(LIMITES.REST_TELEFONO, "Número demasiado largo")
    .optional().or(z.literal('')),
    
  email: z.string()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Correo electrónico inválido")
    .max(LIMITES.REST_EMAIL, "Email demasiado largo")
    .optional().or(z.literal('')),
    
  direccion: z.string()
    .max(LIMITES.REST_DIRECCION, `Máximo ${LIMITES.REST_DIRECCION} caracteres`)
    .refine((v) => !v || v.trim().length >= 5, "Dirección muy corta")
    .optional(),
    
  ciudad: z.string()
    .max(LIMITES.REST_CIUDAD, `Máximo ${LIMITES.REST_CIUDAD} caracteres`)
    .refine((v) => !v || v.trim().length >= 2, "Ciudad inválida")
    .optional(),

  /* Ubicación por divisiones de Colombia. El formulario las pide como
     obligatorias (ver `CAMPOS_OBLIGATORIOS` en la sección de configuración),
     pero aquí se aceptan vacías o nulas: una fila antigua todavía no las tiene
     y el esquema no debe reventar antes de que el dueño las elija. */
  departamento: z.string()
    .max(LIMITES.REST_DEPARTAMENTO, `Máximo ${LIMITES.REST_DEPARTAMENTO} caracteres`)
    .nullish(),

  municipio: z.string()
    .max(LIMITES.REST_MUNICIPIO, `Máximo ${LIMITES.REST_MUNICIPIO} caracteres`)
    .nullish(),
    
  whatsapp: z.string()
    .regex(/^\d{10}$/, "Debe ser un número de 10 dígitos para WhatsApp")
    .max(LIMITES.REST_TELEFONO, "Número demasiado largo")
    .optional().or(z.literal('')),
    
  facebook: z.string()
    .url("URL inválida")
    .max(LIMITES.REST_URL, "URL demasiado larga")
    .optional().or(z.literal('')),
    
  instagram: z.string()
    .url("URL inválida")
    .max(LIMITES.REST_URL, "URL demasiado larga")
    .optional().or(z.literal('')),
    
  horario_apertura: z.string().optional(),
  horario_cierre: z.string().optional(),
  dias_abierto: z.object({
    lunes: z.boolean(),
    martes: z.boolean(),
    miercoles: z.boolean(),
    jueves: z.boolean(),
    viernes: z.boolean(),
    sabado: z.boolean(),
    domingo: z.boolean(),
  }).optional(),
  imagen_logo_url: z.string().optional(),
  imagen_banner_url: z.string().optional(),
});

export const PlatilloSchema = z.object({
  nombre: z.string()
    .min(2, "El nombre es obligatorio")
    .max(LIMITES.PLATILLO_NOMBRE, `Máximo ${LIMITES.PLATILLO_NOMBRE} caracteres`)
    .regex(RE_PLATILLO_NOMBRE, "Revisa el nombre: hay caracteres que no se pueden usar"),
  
  descripcion: z.string()
    .min(5, "La descripción es muy corta")
    .max(LIMITES.PLATILLO_DESC, `Máximo ${LIMITES.PLATILLO_DESC} caracteres`)
    .regex(RE_PLATILLO_DESC, "Revisa la descripción: hay caracteres que no se pueden usar"),
  
  precio: z.number()
    .min(1000, "El precio mínimo es $1.000")
    .max(200000, "El precio máximo es $200.000"),
  
  categoria: z.string()
    .min(1, "Selecciona una categoría")
    .max(LIMITES.PLATILLO_CAT, `Categoría muy larga`),
    
  imagen_url: z.string().min(1, "La imagen es obligatoria"),
  
  ingredientes: z.array(z.string())
    .min(1, "Añade al menos un ingrediente")
    .refine(items => items.every(i => RE_INGREDIENTE.test(i)), {
      message: "Los ingredientes solo pueden contener letras, números y puntuación"
    }),
    
  visible: z.boolean().default(true),
  disponible: z.boolean().default(true),
  destacado: z.boolean().default(false)
});

export type RestauranteFormValues = z.infer<typeof RestauranteSchema>;
export type PlatilloFormValues = z.infer<typeof PlatilloSchema>;
