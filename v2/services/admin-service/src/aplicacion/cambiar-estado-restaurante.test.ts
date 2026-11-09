import { describe, expect, it, vi } from 'vitest';
import { cambiarEstadoRestaurante } from './cambiar-estado-restaurante.js';
import type { RestauranteAdmin, UsuarioAdmin } from '../dominio/admin.js';
import type { AuditoriaRepositorio } from '../puertos/auditoria.repositorio.js';
import type { ServiciosRemotos } from '../puertos/servicios.remotos.js';

const restaurante = { id: 'restaurante-1', activo: false } as RestauranteAdmin;
const usuarioAdmin = { id: 'usuario-1', rol: 'cliente' } as UsuarioAdmin;

const remotosFalsos = (): ServiciosRemotos => ({
  panorama: vi.fn(async () => {
    throw new Error('no usado');
  }),
  listarRestaurantes: vi.fn(async () => {
    throw new Error('no usado');
  }),
  cambiarEstado: vi.fn(async () => restaurante),
  listarUsuarios: vi.fn(async () => {
    throw new Error('no usado');
  }),
  cambiarRol: vi.fn(async () => ({ usuario: usuarioAdmin })),
});

const auditoriaFalsa = (): AuditoriaRepositorio => ({
  registrar: vi.fn(async () => undefined),
  listar: vi.fn(async () => []),
});

const actor = {
  usuarioId: 'admin-1',
  rol: 'superadmin' as const,
  email: 'admin@tukituki.local',
};

describe('cambiarEstadoRestaurante', () => {
  it('suspende el local y registra la auditoría', async () => {
    const remotos = remotosFalsos();
    const auditoria = auditoriaFalsa();
    const cambiar = cambiarEstadoRestaurante({ remotos, auditoria });

    await cambiar(actor, 'token', 'restaurante-1', false);

    expect(remotos.cambiarEstado).toHaveBeenCalledWith(
      'token',
      'restaurante-1',
      false,
    );
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'admin-1',
        accion: 'suspender_restaurante',
        entidad: 'restaurante',
        entidadId: 'restaurante-1',
      }),
    );
  });

  it('usa la acción de activación cuando el local vuelve', async () => {
    const auditoria = auditoriaFalsa();
    const cambiar = cambiarEstadoRestaurante({
      remotos: remotosFalsos(),
      auditoria,
    });

    await cambiar(actor, 'token', 'restaurante-1', true);

    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'activar_restaurante' }),
    );
  });
});
