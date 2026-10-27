import { describe, expect, it } from 'vitest';
import {
  formatearPrecio,
  generarSlug,
  generarSlugUnico,
  normalizarTexto,
} from '../../src/lib/utils';

describe('generarSlug', () => {
  it('quita acentos y pasa a minúsculas', () => {
    expect(generarSlug('La Pizzería Mía')).toBe('la-pizzeria-mia');
  });

  it('colapsa espacios y guiones repetidos', () => {
    expect(generarSlug('  Sabor   Payán  ')).toBe('sabor-payan');
  });

  it('descarta signos y deja el texto utilizable en una URL', () => {
    expect(generarSlug('¿Qué comer? ¡Ya!')).toBe('que-comer-ya');
  });

  it('devuelve cadena vacía si no queda nada', () => {
    expect(generarSlug('###')).toBe('');
  });
});

describe('generarSlugUnico', () => {
  it('usa el nombre cuando existe', () => {
    expect(generarSlugUnico('El Dragón', 'abc-123')).toBe('el-dragon');
  });

  it('cae al id cuando el nombre no produce slug', () => {
    expect(generarSlugUnico('***', 'abc-123')).toBe('abc-123');
  });
});

describe('normalizarTexto', () => {
  it('hace comparables las tildes', () => {
    expect(normalizarTexto('Jamón')).toBe('jamon');
    expect(normalizarTexto('JAMON')).toBe('jamon');
  });

  it('tolera valores vacíos', () => {
    expect(normalizarTexto('')).toBe('');
    expect(normalizarTexto(undefined as unknown as string)).toBe('');
  });
});

describe('formatearPrecio', () => {
  it('antepone el signo de peso y redondea', () => {
    const texto = formatearPrecio(12500.4);
    expect(texto.startsWith('$')).toBe(true);
    expect(texto.replace(/\D/g, '')).toBe('12500');
  });

  it('trata un valor inválido como cero', () => {
    expect(formatearPrecio(Number.NaN)).toBe('$0');
  });
});
