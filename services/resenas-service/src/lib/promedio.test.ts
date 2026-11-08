import { describe, expect, it } from 'vitest';
import { redondearPromedio } from './promedio.js';

describe('redondearPromedio', () => {
  it('deja un decimal', () => {
    expect(redondearPromedio(4.26)).toBe(4.3);
    expect(redondearPromedio(3.14)).toBe(3.1);
  });

  it('mantiene los enteros', () => {
    expect(redondearPromedio(5)).toBe(5);
  });
});
