import { describe, expect, it, vi } from 'vitest';
import { iniciarSesion } from './iniciar-sesion.js';
import type { ContextoAutenticacion, UsuarioPublico } from '../dominio/usuario.js';
import type { AuditoriaRepositorio } from '../puertos/auditoria.repositorio.js';
import type { HasherPassword } from '../puertos/hasher-password.js';
import type { TokensSesion } from '../puertos/tokens-sesion.js';
import type {
  RefreshVigente,
  UsuariosRepositorio,
} from '../puertos/usuarios.repositorio.js';

const usuario: UsuarioPublico = {
  id: 'usuario-1',
  email: 'ana@tukituki.local',
  nombre: 'Ana',
  apellido: 'Demo',
  rol: 'cliente',
  emailVerificado: false,
  creadoEn: new Date('2026-01-01T00:00:00.000Z'),
  avatarUrl: null,
};

const repositorioFalso = (): UsuariosRepositorio => ({
  crearUsuario: vi.fn(async () => usuario),
  buscarPorEmail: vi.fn(async () => ({ ...usuario, passwordHash: 'hash' })),
  buscarPorId: vi.fn(async () => usuario),
  guardarRefreshToken: vi.fn(async () => undefined),
  buscarRefreshVigente: vi.fn(async () => null as RefreshVigente | null),
  revocarRefreshToken: vi.fn(async () => undefined),
  actualizarCredenciales: vi.fn(async () => undefined),
  actualizarPerfil: vi.fn(async () => usuario),
  listarUsuarios: vi.fn(async () => ({ items: [usuario], total: 1 })),
  resumenUsuarios: vi.fn(async () => ({ cliente: 1, dueno: 0, superadmin: 0 })),
  cambiarRol: vi.fn(async () => usuario),
});

const auditoriaFalsa = (): AuditoriaRepositorio => ({
  registrar: vi.fn(async () => undefined),
});

const tokensFalsos = (): TokensSesion => ({
  firmarAcceso: vi.fn(async () => 'access-token'),
  verificarAcceso: vi.fn(async () => ({}) as ContextoAutenticacion),
  crearRefreshToken: vi.fn(() => ({
    token: 'refresh-token',
    hash: 'refresh-hash',
    expiraEn: new Date('2026-02-01T00:00:00.000Z'),
  })),
  hashearToken: vi.fn(() => 'refresh-hash'),
});

describe('iniciarSesion', () => {
  it('devuelve la sesión y audita el login correcto', async () => {
    const auditoria = auditoriaFalsa();
    const iniciar = iniciarSesion({
      usuarios: repositorioFalso(),
      auditoria,
      hasher: { hashear: vi.fn(), verificar: vi.fn(async () => true) },
      tokens: tokensFalsos(),
    });

    const sesion = await iniciar(
      { email: 'ana@tukituki.local', password: 'ClaveSegura123' },
      {},
    );

    expect(sesion.accessToken).toBe('access-token');
    expect(sesion.usuario).not.toHaveProperty('passwordHash');
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'login', usuarioId: 'usuario-1' }),
    );
  });

  it('rechaza una contraseña incorrecta y audita el intento', async () => {
    const auditoria = auditoriaFalsa();
    const iniciar = iniciarSesion({
      usuarios: repositorioFalso(),
      auditoria,
      hasher: { hashear: vi.fn(), verificar: vi.fn(async () => false) },
      tokens: tokensFalsos(),
    });

    await expect(
      iniciar(
        { email: 'ana@tukituki.local', password: 'Incorrecta123' },
        {},
      ),
    ).rejects.toMatchObject({ codigo: 'no_autorizado' });
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'login_fallido' }),
    );
  });
});
