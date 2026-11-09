import { describe, expect, it } from 'vitest';
import { generarSlug } from './slug.js';

describe('generarSlug', () => {
  it('quita acentos y espacios', () => {
    expect(generarSlug('Café Bolívar')).toBe('cafe-bolivar');
  });

  it('recorta símbolos repetidos', () => {
    expect(generarSlug('  Pizzería   Centenario!! ')).toBe('pizzeria-centenario');
  });

  it('usa un slug por defecto si el nombre queda vacío', () => {
    expect(generarSlug('!!!')).toBe('restaurante');
  });
});
