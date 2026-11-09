import { z } from 'zod';

/** Contratos de entrada del servicio de restaurantes. */
const texto = (max: number) => z.string().trim().max(max).optional();
const precio = z.coerce.number().min(0).max(99_999_999);

export const esquemaCrearRestaurante = z.object({
  nombre: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).optional(),
  descripcion: texto(500),
  eslogan: texto(120),
  telefono: texto(20),
  whatsapp: texto(20),
  email: z.string().trim().toLowerCase().email().optional(),
  direccion: texto(160),
  ciudad: texto(80),
  departamento: texto(80),
  horarioApertura: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  horarioCierre: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  cocinas: z.array(z.string().trim().min(2)).max(6).default([]),
});

export const esquemaActualizarRestaurante = esquemaCrearRestaurante
  .omit({ slug: true, cocinas: true })
  .partial();

export const esquemaTema = z.object({
  estiloPlantilla: z.string().trim().min(2).max(40).optional(),
  colorPrimario: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  colorSecundario: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  colorFondo: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  colorTexto: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  colorTextoTitulos: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  colorPrimarioOscuro: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  colorSecundarioOscuro: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  colorFondoOscuro: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  colorTextoOscuro: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  colorTextoTitulosOscuro: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  fuenteTitulos: z.string().trim().min(2).max(60).optional(),
  fuenteCuerpo: z.string().trim().min(2).max(60).optional(),
});

export const esquemaCocinas = z.object({
  cocinas: z.array(z.string().trim().min(2)).min(1).max(6),
});

export const esquemaCategoria = z.object({
  nombre: z.string().trim().min(2).max(60),
  descripcion: texto(200),
  icono: texto(60),
  orden: z.coerce.number().int().min(0).max(999).default(0),
});

export const esquemaPlatillo = z.object({
  nombre: z.string().trim().min(2).max(80),
  descripcion: texto(300),
  precio,
  categoriaId: z.string().uuid().nullable().optional(),
  imagenUrl: z.string().trim().url().max(500).nullable().optional(),
  disponible: z.boolean().default(true),
  vegetariano: z.boolean().default(false),
  vegano: z.boolean().default(false),
  picante: z.boolean().default(false),
  activo: z.boolean().optional(),
  orden: z.coerce.number().int().min(0).max(999).default(0),
});

export const esquemaDisponibilidad = z.object({
  disponible: z.boolean(),
});

export const esquemaListado = z.object({
  q: z.string().trim().max(100).optional(),
  cocina: z.string().trim().max(60).optional(),
  ciudad: z.string().trim().max(80).optional(),
  limite: z.coerce.number().int().min(1).max(60).default(24),
  desde: z.coerce.number().int().min(0).default(0),
});

export const esquemaListadoPlatos = esquemaListado.extend({
  precioMin: z.coerce.number().min(0).optional(),
  precioMax: z.coerce.number().min(0).optional(),
  vegetariano: z.enum(['true', 'false']).optional(),
  vegano: z.enum(['true', 'false']).optional(),
  picante: z.enum(['true', 'false']).optional(),
});

export const esquemaListadoAdmin = z.object({
  q: z.string().trim().max(100).optional(),
  limite: z.coerce.number().int().min(1).max(100).default(50),
  desde: z.coerce.number().int().min(0).default(0),
});

export const esquemaEstadoRestaurante = z.object({
  activo: z.boolean(),
});

export type EntradaCrearRestaurante = z.infer<typeof esquemaCrearRestaurante>;
export type EntradaActualizarRestaurante = z.infer<typeof esquemaActualizarRestaurante>;
export type EntradaTema = z.infer<typeof esquemaTema>;
export type EntradaCategoria = z.infer<typeof esquemaCategoria>;
export type EntradaPlatillo = z.infer<typeof esquemaPlatillo>;
