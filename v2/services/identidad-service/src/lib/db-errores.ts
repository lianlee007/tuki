/** Detecta la violación de unicidad de PostgreSQL (código 23505). */
export const esViolacionUnica = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: string }).code === '23505';
