import { describe, expect, it } from 'vitest';
import { generarSlug } from './slug.js';

describe('generarSlug', () => {
  it('quita acentos y reemplaza espacios', () => {
    expect(generarSlug('Pizzería Centenario')).toBe('pizzeria-centenario');
  });

  it('elimina signos y espacios repetidos', () => {
    expect(generarSlug('  Café  &  Pan  ')).toBe('cafe-pan');
  });

  it('usa un valor seguro cuando el nombre queda vacío', () => {
    expect(generarSlug('***')).toBe('restaurante');
  });
});
