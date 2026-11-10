import { describe, expect, it, vi } from 'vitest';
import { subirMedia } from './subir-media.js';
import type { MediaRegistro } from '../dominio/media.js';
import type { AlmacenObjetos } from '../puertos/almacen.objetos.js';
import type { MediaRepositorio } from '../puertos/media.repositorio.js';

const registro: MediaRegistro = {
  id: 'media-1',
  usuarioId: 'usuario-1',
  destino: 'resenas',
  key: 'resenas/usuario-1/foto.webp',
  contentType: 'image/webp',
  bytes: 1000,
  creadoEn: '2026-01-01T00:00:00.000Z',
};

const repositorioFalso = (): MediaRepositorio => ({
  insertar: vi.fn(async () => registro),
  listarPorUsuario: vi.fn(async () => [registro]),
});

const almacenFalso = (): AlmacenObjetos => ({
  asegurarBucket: vi.fn(async () => undefined),
  subir: vi.fn(async () => undefined),
  urlPublica: vi.fn((key: string) => `http://media/${key}`),
});

const archivo = {
  contentType: 'image/webp',
  bytes: 1000,
  contenido: Buffer.from('imagen'),
};

const cliente = {
  usuarioId: 'usuario-1',
  rol: 'cliente' as const,
  email: 'ana@tukituki.local',
};

describe('subirMedia', () => {
  it('impide que un cliente suba imágenes de menú', async () => {
    const almacen = almacenFalso();
    const subir = subirMedia({ media: repositorioFalso(), almacen });

    await expect(
      subir(cliente, { ...archivo, destino: 'platillos' }),
    ).rejects.toMatchObject({ codigo: 'prohibido' });
    expect(almacen.subir).not.toHaveBeenCalled();
  });

  it('permite a un cliente subir una foto de reseña', async () => {
    const media = repositorioFalso();
    const almacen = almacenFalso();
    const subir = subirMedia({ media, almacen });

    const resultado = await subir(cliente, { ...archivo, destino: 'resenas' });

    expect(almacen.asegurarBucket).toHaveBeenCalled();
    expect(almacen.subir).toHaveBeenCalled();
    expect(media.insertar).toHaveBeenCalledWith(
      expect.objectContaining({ destino: 'resenas', usuarioId: 'usuario-1' }),
    );
    expect(resultado.url).toContain('http://media/resenas/usuario-1/');
  });

  it('rechaza un archivo que no es imagen', async () => {
    const subir = subirMedia({ media: repositorioFalso(), almacen: almacenFalso() });

    await expect(
      subir(cliente, {
        ...archivo,
        contentType: 'application/pdf',
        destino: 'resenas',
      }),
    ).rejects.toMatchObject({ codigo: 'validacion' });
  });
});
