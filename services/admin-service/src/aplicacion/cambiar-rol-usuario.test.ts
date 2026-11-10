import { describe, expect, it, vi } from 'vitest';
import { cambiarRolUsuario } from './cambiar-rol-usuario.js';
import type { RestauranteAdmin, UsuarioAdmin } from '../dominio/admin.js';
import type { AuditoriaRepositorio } from '../puertos/auditoria.repositorio.js';
import type { ServiciosRemotos } from '../puertos/servicios.remotos.js';

const usuarioAdmin = { id: 'usuario-1', rol: 'dueno' } as UsuarioAdmin;
const restaurante = { id: 'restaurante-1' } as RestauranteAdmin;

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

describe('cambiarRolUsuario', () => {
  it('cambia el rol y deja auditoría de la acción', async () => {
    const remotos = remotosFalsos();
    const auditoria = auditoriaFalsa();
    const cambiar = cambiarRolUsuario({ remotos, auditoria });

    await cambiar(
      { usuarioId: 'admin-1', rol: 'superadmin', email: 'admin@tukituki.local' },
      'token',
      'usuario-1',
      'dueno',
    );

    expect(remotos.cambiarRol).toHaveBeenCalledWith('token', 'usuario-1', 'dueno');
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'admin-1',
        accion: 'cambiar_rol',
        entidad: 'usuario',
        entidadId: 'usuario-1',
        detalle: { rol: 'dueno' },
      }),
    );
  });
});
