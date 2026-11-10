import { describe, expect, it, vi } from 'vitest';
import { registrar } from './registrar.js';
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

const repositorioFalso = (existente: unknown = null): UsuariosRepositorio => ({
  crearUsuario: vi.fn(async () => usuario),
  buscarPorEmail: vi.fn(async () => existente as never),
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

const hasherFalso = (): HasherPassword => ({
  hashear: vi.fn(async () => 'hash'),
  verificar: vi.fn(async () => true),
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

describe('registrar', () => {
  it('crea la cuenta, audita y devuelve la sesión', async () => {
    const usuarios = repositorioFalso();
    const auditoria = auditoriaFalsa();
    const registrarCaso = registrar({
      usuarios,
      auditoria,
      hasher: hasherFalso(),
      tokens: tokensFalsos(),
    });

    const sesion = await registrarCaso(
      {
        email: 'ana@tukituki.local',
        password: 'ClaveSegura123',
        nombre: 'Ana',
        apellido: 'Demo',
        rol: 'cliente',
      },
      { ip: '127.0.0.1' },
    );

    expect(sesion.accessToken).toBe('access-token');
    expect(sesion.refreshToken).toBe('refresh-token');
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'registro', usuarioId: 'usuario-1' }),
    );
  });

  it('rechaza un correo que ya existe', async () => {
    const registrarCaso = registrar({
      usuarios: repositorioFalso(usuario),
      auditoria: auditoriaFalsa(),
      hasher: hasherFalso(),
      tokens: tokensFalsos(),
    });

    await expect(
      registrarCaso(
        {
          email: 'ana@tukituki.local',
          password: 'ClaveSegura123',
          nombre: 'Ana',
          apellido: 'Demo',
          rol: 'cliente',
        },
        {},
      ),
    ).rejects.toMatchObject({ codigo: 'conflicto' });
  });
});
