import { describe, expect, it, vi } from 'vitest';
import { crearPlatillo } from './menu.js';
import type { DependenciasRestaurantes } from './dependencias.js';
import type { RestauranteConDueno } from '../dominio/restaurante.js';
import type { MenuRepositorio } from '../puertos/menu.repositorio.js';
import type { PublicoRepositorio } from '../puertos/publico.repositorio.js';
import type { RestaurantesRepositorio } from '../puertos/restaurantes.repositorio.js';

const ajeno: RestauranteConDueno = {
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
  duenoId: 'otro-dueno',
};

const restaurantesFalsos = (): RestaurantesRepositorio => ({
  buscarPorId: vi.fn(async () => ajeno),
  buscarPorDueno: vi.fn(async () => ajeno),
  existeSlug: vi.fn(async () => true),
  crearConBase: vi.fn(),
  actualizar: vi.fn(),
  actualizarTema: vi.fn(),
  reemplazarCocinas: vi.fn(),
  cocinasDe: vi.fn(async () => []),
  temaDe: vi.fn(async () => null),
  listarCocinas: vi.fn(async () => []),
  listarTodos: vi.fn(async () => ({ items: [], total: 0 })),
  resumen: vi.fn(async () => ({ total: 0, activos: 0 })),
  cambiarActivo: vi.fn(),
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

describe('crearPlatillo', () => {
  it('impide editar el menú de un local ajeno', async () => {
    const menu = menuFalso();
    const dependencias: DependenciasRestaurantes = {
      restaurantes: restaurantesFalsos(),
      menu,
      publico: publicoFalso(),
    };
    const crear = crearPlatillo(dependencias);

    await expect(
      crear(
        { usuarioId: 'usuario-1', rol: 'dueno', email: 'dueno@tukituki.local' },
        'restaurante-1',
        {
          nombre: 'Tinto',
          precio: 3000,
          disponible: true,
          vegetariano: true,
          vegano: true,
          picante: false,
          ingredientes: [],
          alergenos: [],
          destacado: false,
          orden: 0,
        },
      ),
    ).rejects.toMatchObject({ codigo: 'prohibido' });
    expect(menu.crearPlatillo).not.toHaveBeenCalled();
  });
});
