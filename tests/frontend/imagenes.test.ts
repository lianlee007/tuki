import { describe, expect, it } from 'vitest';
import { MAX_FOTO_MB, validarFoto } from '../../src/lib/imagenes';

const archivo = (type: string, size = 1024): { type: string; size: number } => ({ type, size });

describe('validarFoto', () => {
  it('acepta los formatos que entiende Cloudinary', () => {
    expect(validarFoto(archivo('image/jpeg'))).toBeNull();
    expect(validarFoto(archivo('image/png'))).toBeNull();
    expect(validarFoto(archivo('image/webp'))).toBeNull();
  });

  it('rechaza lo que no es una imagen', () => {
    expect(validarFoto(archivo('application/pdf'))).toMatch(/imagen/i);
    expect(validarFoto(archivo('video/mp4'))).toMatch(/imagen/i);
  });

  it(`corta por encima de ${MAX_FOTO_MB} MB`, () => {
    const justo = MAX_FOTO_MB * 1024 * 1024;
    expect(validarFoto(archivo('image/jpeg', justo))).toBeNull();
    expect(validarFoto(archivo('image/jpeg', justo + 1))).toMatch(/MB/);
  });

  it('no deja pasar un archivo vacío', () => {
    expect(validarFoto(archivo('image/jpeg', 0))).toMatch(/vacía/i);
  });
});
