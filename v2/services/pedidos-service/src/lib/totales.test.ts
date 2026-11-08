import { describe, expect, it } from 'vitest';
import { calcularTotales } from './totales.js';

describe('calcularTotales', () => {
  it('suma precio por cantidad', () => {
    expect(
      calcularTotales([
        { precioUnitario: 12000, cantidad: 2 },
        { precioUnitario: 4500.5, cantidad: 1 },
      ]),
    ).toEqual({ subtotal: 28500.5, total: 28500.5 });
  });

  it('redondea a dos decimales', () => {
    expect(calcularTotales([{ precioUnitario: 0.1, cantidad: 3 }])).toEqual({
      subtotal: 0.3,
      total: 0.3,
    });
  });
});
