import { describe, expect, it } from 'vitest';
import { firmarAcceso, verificarAcceso } from './tokens.js';

describe('tokens de acceso', () => {
  it('firma y verifica la identidad del usuario', async () => {
    const token = await firmarAcceso({
      usuarioId: '7f3e7d2a-7f7a-4f3e-9d1a-2b3c4d5e6f70',
      rol: 'dueno',
      email: 'dueno@tukituki.local',
    });

    const identidad = await verificarAcceso(token);
    expect(identidad).toMatchObject({
      usuarioId: '7f3e7d2a-7f7a-4f3e-9d1a-2b3c4d5e6f70',
      rol: 'dueno',
      email: 'dueno@tukituki.local',
    });
  });

  it('rechaza un token manipulado', async () => {
    const token = await firmarAcceso({
      usuarioId: '7f3e7d2a-7f7a-4f3e-9d1a-2b3c4d5e6f70',
      rol: 'cliente',
      email: 'cliente@tukituki.local',
    });

    await expect(verificarAcceso(`${token}alterado`)).rejects.toBeTruthy();
  });
});
