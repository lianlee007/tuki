import { describe, expect, it } from 'vitest';
import { validarArchivo } from './validar-archivo.js';

describe('validarArchivo', () => {
  it('acepta una imagen de menú dentro del límite', () => {
    expect(
      validarArchivo({
        contentType: 'image/webp',
        bytes: 1_000_000,
        destino: 'platillos',
      }),
    ).toBeNull();
  });

  it('rechaza un tipo que no es imagen', () => {
    expect(
      validarArchivo({
        contentType: 'application/pdf',
        bytes: 1_000,
        destino: 'platillos',
      }),
    ).toContain('JPG');
  });

  it('rechaza una imagen de menú que supera 5 MB', () => {
    expect(
      validarArchivo({
        contentType: 'image/png',
        bytes: 6 * 1024 * 1024,
        destino: 'platillos',
      }),
    ).toContain('5 MB');
  });

  it('permite hasta 8 MB en una foto de reseña', () => {
    expect(
      validarArchivo({
        contentType: 'image/jpeg',
        bytes: 7 * 1024 * 1024,
        destino: 'resenas',
      }),
    ).toBeNull();
  });
});
