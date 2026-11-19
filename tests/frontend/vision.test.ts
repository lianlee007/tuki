import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  mensajeFotoRechazada,
  revisarFotoComida,
  type RevisionFoto,
} from '../../src/lib/vision';

const foto = new File(['foto'], 'plato.jpg', { type: 'image/jpeg' });

const respuesta = (cuerpo: object, ok = true, status = 200) =>
  Promise.resolve({ ok, status, json: () => Promise.resolve(cuerpo) } as Response);

const revisionRechazada: RevisionFoto = {
  revisada: true,
  esComida: false,
  probabilidadComida: 0.18,
  etiqueta: 'no-comida',
  mensaje: 'La foto no parece comida.',
};

describe('revisarFotoComida', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('acepta la foto cuando el servicio dice que es comida', async () => {
    const fetchFalso = vi.fn(() =>
      respuesta({
        es_comida: true,
        etiqueta: 'comida',
        confianza: 0.96,
        probabilidad_comida: 0.96,
        umbral: 0.5,
        modelo: 'comida-v1.pt',
      })
    );
    vi.stubGlobal('fetch', fetchFalso);

    const revision = await revisarFotoComida(foto);

    expect(revision.revisada).toBe(true);
    expect(revision.esComida).toBe(true);
    expect(revision.probabilidadComida).toBe(0.96);
    expect(fetchFalso).toHaveBeenCalledOnce();
    const [url, opciones] = fetchFalso.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/api/v1/vision/clasificar');
    expect((opciones.body as FormData).get('imagen')).toBe(foto);
  });

  it('rechaza la foto cuando el servicio no ve comida', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        respuesta({
          es_comida: false,
          etiqueta: 'no-comida',
          confianza: 0.82,
          probabilidad_comida: 0.18,
          umbral: 0.5,
        })
      )
    );

    const revision = await revisarFotoComida(foto);

    expect(revision.revisada).toBe(true);
    expect(revision.esComida).toBe(false);
    expect(revision.probabilidadComida).toBe(0.18);
  });

  it('no bloquea la subida si el servicio responde 503', async () => {
    vi.stubGlobal('fetch', vi.fn(() => respuesta({ detail: 'sin modelo' }, false, 503)));

    const revision = await revisarFotoComida(foto);

    expect(revision.revisada).toBe(false);
    expect(revision.esComida).toBe(true);
    expect(revision.mensaje).toMatch(/no está disponible/i);
  });

  it('no bloquea la subida si no hay red', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('offline'))));

    const revision = await revisarFotoComida(foto);

    expect(revision.revisada).toBe(false);
    expect(revision.esComida).toBe(true);
  });

  it('trata una respuesta sin es_comida como no disponible', async () => {
    vi.stubGlobal('fetch', vi.fn(() => respuesta({ modelo: 'comida-v1.pt' })));

    const revision = await revisarFotoComida(foto);

    expect(revision.revisada).toBe(false);
  });
});

describe('mensajeFotoRechazada', () => {
  it('incluye el porcentaje de seguridad', () => {
    expect(mensajeFotoRechazada(revisionRechazada)).toMatch(/18 %/);
    expect(mensajeFotoRechazada(revisionRechazada)).toMatch(/no parece comida/i);
  });

  it('funciona sin probabilidad', () => {
    expect(mensajeFotoRechazada({ ...revisionRechazada, probabilidadComida: null })).toMatch(
      /no parece comida/i
    );
  });
});
