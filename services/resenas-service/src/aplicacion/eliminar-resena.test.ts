import { describe, expect, it, vi } from 'vitest';
import { eliminarResena } from './eliminar-resena.js';
import type { Resena } from '../dominio/resena.js';
import type { ResenasRepositorio } from '../puertos/resenas.repositorio.js';

const resena: Resena = {
  id: 'resena-1',
  restauranteId: 'restaurante-1',
  platilloId: null,
  usuarioId: 'usuario-1',
  nombreCliente: 'Ana',
  calificacion: 5,
  comentario: null,
  fotoUrl: null,
  respuestaDueno: null,
  utiles: 0,
  creadoEn: '2026-01-01T00:00:00.000Z',
};

const repositorioFalso = (): ResenasRepositorio => ({
  listarPorRestaurante: vi.fn(async () => [resena]),
  listarPorUsuario: vi.fn(async () => [resena]),
  crear: vi.fn(async () => resena),
  buscarPorId: vi.fn(async () => resena),
  eliminar: vi.fn(async () => true),
  marcarUtil: vi.fn(async () => undefined),
  quitarUtil: vi.fn(async () => undefined),
  responder: vi.fn(async () => resena),
  borrarRespuesta: vi.fn(async () => resena),
  cambiarVisible: vi.fn(async () => resena),
  resumen: vi.fn(async () => ({ promedio: 5, cantidad: 1 })),
});

describe('eliminarResena', () => {
  it('deja borrar la reseña propia', async () => {
    const resenas = repositorioFalso();
    const eliminar = eliminarResena({ resenas });

    await eliminar(
      { usuarioId: 'usuario-1', rol: 'cliente', email: 'ana@tukituki.local' },
      'resena-1',
    );

    expect(resenas.eliminar).toHaveBeenCalledWith('resena-1');
  });

  it('impide borrar la reseña de otra persona', async () => {
    const resenas = repositorioFalso();
    const eliminar = eliminarResena({ resenas });

    await expect(
      eliminar(
        { usuarioId: 'otro', rol: 'cliente', email: 'otro@tukituki.local' },
        'resena-1',
      ),
    ).rejects.toMatchObject({ codigo: 'prohibido' });
  });
});
