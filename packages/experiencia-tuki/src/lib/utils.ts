/**
 * Utilidades generales del sistema
 */

/**
 * Genera un slug (URL amigable) a partir de un texto
 * Ejemplo: "La Pizzería Mía" -> "la-pizzeria-mia"
 */
export const generarSlug = (texto: string): string => {
  return texto
    .toLowerCase()
    .normalize('NFD') // Normaliza caracteres especiales
    .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Elimina caracteres especiales
    .replace(/\s+/g, '-') // Reemplaza espacios con guiones
    .replace(/-+/g, '-') // Elimina guiones múltiples
    .replace(/^-|-$/g, ''); // Elimina guiones al inicio y final
};

/**
 * Genera un slug único a partir del nombre del restaurante
 * Formato: "nombre-restaurante" (solo el nombre, sin ID)
 */
export const generarSlugUnico = (nombre: string, id: string): string => {
  const slugBase = generarSlug(nombre);
  // Si el slug está vacío, usar el ID completo como fallback
  if (!slugBase) return id;
  // Devolver solo el slug del nombre: "el-dragon"
  return slugBase;
};

/**
 * ¿El visitante pidió menos movimiento en su sistema?
 * Se consulta en el momento (no se cachea) para que un cambio de preferencia
 * se respete sin recargar.
 */
export const prefiereMenosMovimiento = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Texto listo para comparar: minúsculas y sin acentos.
 * "Jamón" y "jamon" deben encontrar lo mismo al buscar.
 */
export const normalizarTexto = (texto: string): string =>
  (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/**
 * Precio para mostrar. Punto de miles y sin decimales: una carta no los usa.
 */
export const formatearPrecio = (valor: number): string =>
  `$${Math.round(Number(valor) || 0).toLocaleString('es-CO')}`;

/**
 * Convierte en lista cualquier forma en la que lleguen los campos de texto
 * múltiple (`ingredientes`, `alergenos`).
 *
 * La base entrega `text[]`, pero una fila antigua o una respuesta intermedia
 * puede traer un string —incluso con forma de JSON—. Sin esta normalización,
 * `(valor ?? []).filter(...)` revienta la pantalla con
 * `filter is not a function`.
 */
export const normalizarListaTexto = (valor: unknown): string[] => {
  const limpiar = (items: unknown[]): string[] =>
    items
      .map((item) => String(item ?? '').trim())
      .filter(Boolean);

  if (Array.isArray(valor)) return limpiar(valor);
  if (typeof valor !== 'string') return [];

  const texto = valor.trim();
  if (!texto) return [];

  if (texto.startsWith('[') && texto.endsWith(']')) {
    try {
      const parseado = JSON.parse(texto);
      if (Array.isArray(parseado)) return limpiar(parseado);
    } catch {
      // No era JSON válido: se trata como lista separada por comas.
    }
  }

  // Literal de arreglo de PostgreSQL (`{Pan,"Carne asada"}`), por si la
  // columna quedó como `text` en una base antigua.
  if (texto.startsWith('{') && texto.endsWith('}')) {
    return limpiar(
      texto
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"')),
    );
  }

  return limpiar(texto.split(','));
};

