/** Promedio de calificaciones con un decimal, como lo muestra la ficha. */
export const redondearPromedio = (valor: number): number =>
  Math.round(valor * 10) / 10;
