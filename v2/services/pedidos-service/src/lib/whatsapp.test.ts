import { describe, expect, it } from 'vitest';
import { generarWhatsappUrl } from './whatsapp.js';

describe('generarWhatsappUrl', () => {
  it('incluye el total y normaliza el indicativo', () => {
    const url = generarWhatsappUrl({
      restaurante: { nombre: 'Café Bolívar', whatsapp: '3001234567', telefono: null },
      cliente: { nombre: 'Ana', telefono: '3100000000', direccion: 'Calle 1' },
      items: [
        { platilloId: 'p1', nombre: 'Tinto', precioUnitario: 3000, cantidad: 2 },
      ],
      total: 6000,
      tipoPedido: 'entrega',
    });

    expect(url).toContain('https://wa.me/573001234567');
    expect(decodeURIComponent(url)).toContain('Total: $6.000');
    expect(decodeURIComponent(url)).toContain('Calle 1');
  });
});
