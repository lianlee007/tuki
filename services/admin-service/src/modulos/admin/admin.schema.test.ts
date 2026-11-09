import { describe, expect, it } from 'vitest';
import { esquemaListado } from './admin.schema.js';

describe('esquemaListado', () => {
  it('aplica límites por defecto', () => {
    expect(esquemaListado.parse({})).toEqual({ limite: 50, desde: 0 });
  });

  it('convierte los valores de la URL', () => {
    expect(esquemaListado.parse({ limite: '10', desde: '5' })).toMatchObject({
      limite: 10,
      desde: 5,
    });
  });
});
