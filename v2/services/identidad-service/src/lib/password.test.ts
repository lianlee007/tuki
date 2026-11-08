import { describe, expect, it } from 'vitest';
import { hashearPassword, verificarPassword } from './password.js';

describe('password', () => {
  it('genera un hash distinto al texto plano y lo verifica', async () => {
    const hash = await hashearPassword('ClaveSegura123');
    expect(hash).not.toBe('ClaveSegura123');
    await expect(verificarPassword(hash, 'ClaveSegura123')).resolves.toBe(true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const hash = await hashearPassword('ClaveSegura123');
    await expect(verificarPassword(hash, 'OtraClave123')).resolves.toBe(false);
  });
});
