import type { Rol } from '@tuki/dominio';

const numero = new Intl.NumberFormat('es-CO');
const moneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});
const fecha = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const fechaCorta = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' });
const relativo = new Intl.RelativeTimeFormat('es-CO', { numeric: 'auto' });

export const formatearNumero = (valor: number): string => numero.format(valor);

export const formatearMoneda = (valor: number): string => moneda.format(valor);

export const formatearFecha = (iso: string): string => {
  const valor = new Date(iso);
  return Number.isNaN(valor.getTime()) ? 'Fecha desconocida' : fecha.format(valor);
};

export const formatearFechaCorta = (iso: string): string => {
  const valor = new Date(iso);
  return Number.isNaN(valor.getTime()) ? '—' : fechaCorta.format(valor);
};

/** «Hace 4 minutos», «ayer» o la fecha completa cuando ya es antiguo. */
export const formatearRelativo = (iso: string): string => {
  const valor = new Date(iso);
  if (Number.isNaN(valor.getTime())) return 'Fecha desconocida';

  const segundos = Math.round((valor.getTime() - Date.now()) / 1000);
  const absoluto = Math.abs(segundos);

  if (absoluto < 60) return relativo.format(segundos, 'second');
  if (absoluto < 3600) return relativo.format(Math.round(segundos / 60), 'minute');
  if (absoluto < 86400) return relativo.format(Math.round(segundos / 3600), 'hour');
  if (absoluto < 604800) return relativo.format(Math.round(segundos / 86400), 'day');
  return fechaCorta.format(valor);
};

export const iniciales = (nombre: string, apellido = ''): string => {
  const letras = `${nombre.trim()} ${apellido.trim()}`
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
  return letras || '·';
};

export const nombreCompleto = (nombre: string, apellido = ''): string =>
  `${nombre.trim()} ${apellido.trim()}`.trim() || 'Sin nombre';

export const acortarId = (id: string | null | undefined): string =>
  id ? `${id.slice(0, 8)}…` : 'Sin identificador';

export const ETIQUETAS_ROL: Record<Rol, string> = {
  cliente: 'Comensal',
  dueno: 'Dueño',
  superadmin: 'Superadmin',
};

export const ETIQUETAS_ENTIDAD: Record<string, string> = {
  restaurante: 'Restaurante',
  usuario: 'Cuenta',
  pedido: 'Pedido',
  resena: 'Reseña',
};

export const ETIQUETAS_ACCION: Record<string, string> = {
  activar_restaurante: 'Restaurante activado',
  suspender_restaurante: 'Restaurante suspendido',
  cambiar_rol: 'Rol actualizado',
};

export const describirAccion = (accion: string): string =>
  ETIQUETAS_ACCION[accion] ??
  accion
    .replaceAll('_', ' ')
    .replace(/^\w/, (letra) => letra.toUpperCase());

export const valorLegible = (valor: unknown): string => {
  if (valor === null || valor === undefined) return '—';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor);
  try {
    return JSON.stringify(valor);
  } catch {
    return String(valor);
  }
};

/** Búsqueda tolerante a mayúsculas y tildes. */
export const normalizarTexto = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

