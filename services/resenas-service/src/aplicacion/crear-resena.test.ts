import { describe, expect, it, vi } from 'vitest';
import { crearResena } from './crear-resena.js';
import type { Resena } from '../dominio/resena.js';
import type { ResenasRepositorio } from '../puertos/resenas.repositorio.js';
import type { RestaurantesCliente } from '../puertos/restaurantes.cliente.js';

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

const clienteFalso = (): RestaurantesCliente => ({
  verificarRestaurante: vi.fn(async () => undefined),
  verificarPropietario: vi.fn(async () => undefined),
});

describe('crearResena', () => {
  it('verifica el restaurante y normaliza los opcionales', async () => {
    const resenas = repositorioFalso();
    const restaurantes = clienteFalso();
    const crear = crearResena({ resenas, restaurantes });

    await crear(
      { usuarioId: 'usuario-1', rol: 'cliente', email: 'ana@tukituki.local' },
      {
        restauranteId: 'restaurante-1',
        nombreCliente: 'Ana',
        calificacion: 5,
      },
    );

    expect(restaurantes.verificarRestaurante).toHaveBeenCalledWith('restaurante-1');
    expect(resenas.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: 'usuario-1',
        platilloId: null,
        comentario: null,
        fotoUrl: null,
      }),
    );
  });
});
