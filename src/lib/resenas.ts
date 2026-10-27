/**
 * Reglas de las reseñas que no dependen de React ni de Supabase.
 *
 * La tabla `valoraciones` guarda la nota, el comentario, el plato y el estado
 * de moderación. Aquí se decide qué es público y cómo se resume, para que la
 * ficha, el panel y las pruebas usen exactamente el mismo criterio.
 */

export interface Resena {
  id: string;
  calificacion: number;
  comentario: string | null;
  created_at: string | null;
  /** Puede faltar en filas antiguas; la interfaz cae en «Comensal». */
  nombre_cliente?: string | null;
  platillo_id: string | null;
  aprobado: boolean | null;
  visible: boolean | null;
}

export interface ResumenResenas {
  /** Promedio con un decimal. 0 cuando no hay reseñas. */
  promedio: number;
  cantidad: number;
  /** Índice 0 = una estrella … índice 4 = cinco estrellas. */
  distribucion: number[];
}

const NOTA_MINIMA = 1;
const NOTA_MAXIMA = 5;
export const MAX_COMENTARIO = 600;
export const MAX_NOMBRE = 60;

/**
 * Una reseña es pública solo si el dueño la aprobó explícitamente y nadie la
 * ocultó. `null` es «pendiente», no «aprobada»: es el mismo criterio que usan
 * las funciones SQL de promedio (`coalesce(aprobado, false)`), así que la nota
 * de la portada y la lista no pueden contar cosas distintas.
 */
export const esPublica = (resena: Resena): boolean =>
  resena.aprobado === true && resena.visible !== false;

export const resenasPublicas = (resenas: Resena[]): Resena[] =>
  resenas.filter(esPublica);

/** Calcula promedio, cantidad y distribución de un conjunto de reseñas. */
export const resumenDe = (resenas: Resena[]): ResumenResenas => {
  const validas = resenas.filter(
    (resena) =>
      Number.isFinite(resena.calificacion) &&
      resena.calificacion >= NOTA_MINIMA &&
      resena.calificacion <= NOTA_MAXIMA
  );

  const distribucion = [0, 0, 0, 0, 0];
  let suma = 0;

  validas.forEach((resena) => {
    const nota = Math.round(resena.calificacion);
    suma += resena.calificacion;
    distribucion[nota - 1] += 1;
  });

  const cantidad = validas.length;
  const promedio = cantidad === 0 ? 0 : Math.round((suma / cantidad) * 10) / 10;

  return { promedio, cantidad, distribucion };
};

/**
 * El promedio del restaurante es el de las reseñas del local, no el de los
 * platos sueltos. Si no hay ninguna del local, se usa el total para no mostrar
 * un «0.0» cuando la ficha ya tiene opiniones de platos.
 */
export const resumenRestaurante = (resenas: Resena[]): ResumenResenas => {
  const delLocal = resenas.filter((resena) => resena.platillo_id === null);
  return resumenDe(delLocal.length > 0 ? delLocal : resenas);
};

/** «12 de octubre de 2026». Una fecha inválida no rompe la ficha. */
export const fechaResena = (iso: string | null): string => {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(fecha);
};

/** Nunca se muestra el correo: solo el nombre que el comensal escribió. */
export const nombreCliente = (resena: Resena): string =>
  resena.nombre_cliente?.trim() || 'Comensal';

/** Iniciales para el avatar: «Ana María Pérez» → «AP». */
export const iniciales = (nombre: string): string => {
  const partes = nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (partes.length === 0) return 'C';
  return partes.map((parte) => parte.charAt(0).toUpperCase()).join('');
};

/** Devuelve el primer error de la reseña o `null` si se puede guardar. */
export const validarResena = (entrada: {
  calificacion: number;
  comentario: string;
  nombre: string;
}): string | null => {
  if (
    !Number.isInteger(entrada.calificacion) ||
    entrada.calificacion < NOTA_MINIMA ||
    entrada.calificacion > NOTA_MAXIMA
  ) {
    return 'Elige de 1 a 5 estrellas.';
  }

  if (entrada.comentario.trim().length > MAX_COMENTARIO) {
    return `El comentario no puede pasar de ${MAX_COMENTARIO} caracteres.`;
  }

  if (entrada.nombre.trim().length > MAX_NOMBRE) {
    return `El nombre no puede pasar de ${MAX_NOMBRE} caracteres.`;
  }

  return null;
};
