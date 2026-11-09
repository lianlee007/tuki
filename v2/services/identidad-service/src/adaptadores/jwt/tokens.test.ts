import { describe, expect, it } from 'vitest';
import { crearTokensSesion } from './tokens.js';

describe('tokens de acceso', () => {
  it('firma y verifica la identidad del usuario', async () => {
    const tokens = crearTokensSesion();
    const token = await tokens.firmarAcceso({
      usuarioId: '7f3e7d2a-7f7a-4f3e-9d1a-2b3c4d5e6f70',
      rol: 'dueno',
      email: 'dueno@tukituki.local',
    });

    const identidad = await tokens.verificarAcceso(token);
    expect(identidad).toMatchObject({
      usuarioId: '7f3e7d2a-7f7a-4f3e-9d1a-2b3c4d5e6f70',
      rol: 'dueno',
      email: 'dueno@tukituki.local',
    });
  });

  it('rechaza un token manipulado', async () => {
    const tokens = crearTokensSesion();
    const token = await tokens.firmarAcceso({
      usuarioId: '7f3e7d2a-7f7a-4f3e-9d1a-2b3c4d5e6f70',
      rol: 'cliente',
      email: 'cliente@tukituki.local',
    });

    await expect(tokens.verificarAcceso(`${token}alterado`)).rejects.toBeTruthy();
  });
});
