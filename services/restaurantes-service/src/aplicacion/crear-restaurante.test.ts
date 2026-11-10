import { describe, expect, it, vi } from 'vitest';
import { crearRestaurante } from './perfil-restaurante.js';
import type { DependenciasRestaurantes } from './dependencias.js';
import type { Restaurante, RestauranteConDueno } from '../dominio/restaurante.js';
import type { MenuRepositorio } from '../puertos/menu.repositorio.js';
import type { PublicoRepositorio } from '../puertos/publico.repositorio.js';
import type { RestaurantesRepositorio } from '../puertos/restaurantes.repositorio.js';

const restaurante: RestauranteConDueno = {
  id: 'restaurante-1',
  slug: 'cafe-bolivar',
  nombre: 'Café Bolívar',
  descripcion: null,
  eslogan: null,
  telefono: null,
  whatsapp: null,
  email: null,
  direccion: null,
  ciudad: null,
  departamento: null,
  pais: null,
  imagenLogoUrl: null,
  imagenBannerUrl: null,
  horarioApertura: null,
  horarioCierre: null,
  facebook: null,
  instagram: null,
  twitter: null,
  diasAbierto: {},
  activo: true,
  creadoEn: '2026-01-01T00:00:00.000Z',
  duenoId: 'usuario-1',
};

const restaurantesFalsos = (existente: RestauranteConDueno | null = null): RestaurantesRepositorio => ({
  buscarPorId: vi.fn(async () => restaurante),
  buscarPorDueno: vi.fn(async () => existente),
  existeSlug: vi.fn(async () => false),
  crearConBase: vi.fn(async () => ({
    restaurante: restaurante as Restaurante,
    tema: null,
  })),
  actualizar: vi.fn(async () => restaurante),
  actualizarTema: vi.fn(async () => null),
  reemplazarCocinas: vi.fn(async () => undefined),
  cocinasDe: vi.fn(async () => []),
  temaDe: vi.fn(async () => null),
  listarCocinas: vi.fn(async () => []),
  listarTodos: vi.fn(async () => ({ items: [restaurante], total: 1 })),
  resumen: vi.fn(async () => ({ total: 1, activos: 1 })),
  cambiarActivo: vi.fn(async () => restaurante),
});

const menuFalso = (): MenuRepositorio => ({
  listarCategorias: vi.fn(async () => []),
  crearCategoria: vi.fn(async () => null),
  actualizarCategoria: vi.fn(async () => null),
  eliminarCategoria: vi.fn(async () => true),
  listarPlatillos: vi.fn(async () => []),
  crearPlatillo: vi.fn(async () => null),
  actualizarPlatillo: vi.fn(async () => null),
  eliminarPlatillo: vi.fn(async () => true),
  cambiarDisponibilidad: vi.fn(async () => null),
});

const publicoFalso = (): PublicoRepositorio => ({
  obtenerPublico: vi.fn(async () => null),
  listarRestaurantes: vi.fn(async () => ({ items: [], total: 0 })),
  buscarPlatos: vi.fn(async () => ({ items: [], total: 0 })),
  obtenerMenuPublico: vi.fn(async () => null),
});

const dependencias = (restaurantes: RestaurantesRepositorio): DependenciasRestaurantes => ({
  restaurantes,
  menu: menuFalso(),
  publico: publicoFalso(),
});

const usuario = {
  usuarioId: 'usuario-1',
  rol: 'dueno' as const,
  email: 'dueno@tukituki.local',
};

describe('crearRestaurante', () => {
  it('genera el slug y asigna el dueño', async () => {
    const restaurantes = restaurantesFalsos();
    const crear = crearRestaurante(dependencias(restaurantes));

    await crear(usuario, { nombre: 'Café Bolívar', cocinas: ['cafeteria'] });

    expect(restaurantes.crearConBase).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'cafe-bolivar',
        duenoId: 'usuario-1',
      }),
    );
  });

  it('rechaza un segundo restaurante para el mismo dueño', async () => {
    const crear = crearRestaurante(dependencias(restaurantesFalsos(restaurante)));

    await expect(
      crear(usuario, { nombre: 'Otro local', cocinas: [] }),
    ).rejects.toMatchObject({ codigo: 'conflicto' });
  });
});
