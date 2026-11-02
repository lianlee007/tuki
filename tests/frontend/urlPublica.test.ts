import { describe, expect, it } from 'vitest';
import { resolverOrigen, unirOrigen, urlPublica } from '../../src/lib/urlPublica';

describe('unirOrigen', () => {
  it('añade la barra inicial que falte', () => {
    expect(unirOrigen('http://host:8080', 'restaurante/donde-lian')).toBe(
      'http://host:8080/restaurante/donde-lian',
    );
  });

  it('no duplica la barra si la ruta ya la trae', () => {
    expect(unirOrigen('http://host:8080', '/restaurante/donde-lian')).toBe(
      'http://host:8080/restaurante/donde-lian',
    );
  });

  it('quita la barra final del origen', () => {
    expect(unirOrigen('https://tuki.example/', '/qr')).toBe('https://tuki.example/qr');
  });

  it('devuelve el origen sin barra cuando no hay ruta', () => {
    expect(unirOrigen('http://host:8080/')).toBe('http://host:8080');
  });
});

describe('resolverOrigen', () => {
  it('prefiere el origen configurado y le quita la barra final', () => {
    expect(resolverOrigen('http://host:8080/', 'http://ignorado')).toBe('http://host:8080');
  });

  it('cae al origen actual si no hay configuración', () => {
    expect(resolverOrigen('', 'http://localhost:3000')).toBe('http://localhost:3000');
  });

  it('trata los espacios como configuración vacía', () => {
    expect(resolverOrigen('   ', 'http://localhost:3000')).toBe('http://localhost:3000');
  });

  it('produce enlaces absolutos con el puerto explícito', () => {
    expect(unirOrigen(resolverOrigen('http://host:8080'), '/restaurante/donde-lian')).toBe(
      'http://host:8080/restaurante/donde-lian',
    );
  });
});

describe('urlPublica', () => {
  it('no falla fuera del navegador', () => {
    expect(urlPublica('/qr')).toBe('/qr');
  });
});
