/**
 * API pública del módulo `resenas`.
 *
 * Se expone el dominio (tipos y reglas de moderación/resumen), el repositorio
 * de Supabase y el hook que usan la ficha y el panel. Nadie importa las capas
 * internas desde fuera del módulo.
 */
export * from './dominio/resenas';
export { apiResenas, type ResenaConRestaurante } from './infraestructura/apiResenas';
export { useResenas } from './aplicacion/useResenas';
