import { describe, expect, it } from 'vitest';
import { esUrlDeMedios, normalizarUrlMedios } from './urlMedios.js';

const BASE = 'https://tukiapi.example.com/tuki-media';
const ARCHIVO = '/restaurantes/a54e4e63/dd98864b.jpg';
const LEGADO = `http://169.58.151.195:8084/tuki-media${ARCHIVO}`;

describe('normalizarUrlMedios', () => {
  it('reescribe el host heredado por la base pública HTTPS', () => {
    expect(normalizarUrlMedios(LEGADO, BASE)).toBe(`${BASE}${ARCHIVO}`);
  });

  it('conserva la consulta y el fragmento', () => {
    expect(normalizarUrlMedios(`${LEGADO}?v=2#foto`, BASE)).toBe(
      `${BASE}${ARCHIVO}?v=2#foto`,
    );
  });

  it('es idempotente con URLs que ya usan la base pública', () => {
    const canonica = `${BASE}${ARCHIVO}`;
    expect(normalizarUrlMedios(canonica, BASE)).toBe(canonica);
  });

  it('deja intactas las fotos de terceros', () => {
    const flickr = 'https://live.staticflickr.com/7284/8750270045_b0ae7311fe_b.jpg';
    expect(normalizarUrlMedios(flickr, BASE)).toBe(flickr);
  });

  it('no toca rutas que no pertenecen al bucket', () => {
    const otra = 'http://169.58.151.195:8084/otros/archivo.jpg';
    expect(normalizarUrlMedios(otra, BASE)).toBe(otra);
  });

  it('respeta el almacén local cuando la base no es HTTPS', () => {
    const local = 'http://localhost:9000/tuki-media/platillos/foto.jpg';
    expect(normalizarUrlMedios(local, 'http://localhost:9000/tuki-media')).toBe(local);
  });

  it('no reescribe si no hay base configurada', () => {
    expect(normalizarUrlMedios(LEGADO)).toBe(LEGADO);
    expect(normalizarUrlMedios(LEGADO, '')).toBe(LEGADO);
  });

  it('conserva los nulos y los valores vacíos', () => {
    expect(normalizarUrlMedios(null, BASE)).toBeNull();
    expect(normalizarUrlMedios(undefined, BASE)).toBeNull();
    expect(normalizarUrlMedios('   ', BASE)).toBe('');
  });
});

describe('esUrlDeMedios', () => {
  it('reconoce los objetos del bucket', () => {
    expect(esUrlDeMedios(LEGADO)).toBe(true);
    expect(esUrlDeMedios(`${BASE}${ARCHIVO}`)).toBe(true);
  });

  it('descarta imágenes de terceros y texto inválido', () => {
    expect(esUrlDeMedios('https://live.staticflickr.com/foto.jpg')).toBe(false);
    expect(esUrlDeMedios('no es una url')).toBe(false);
  });
});
