import { describe, expect, it } from 'vitest';
import { crearHasherPassword } from './password.js';

describe('password', () => {
  it('genera un hash distinto al texto plano y lo verifica', async () => {
    const hasher = crearHasherPassword();
    const hash = await hasher.hashear('ClaveSegura123');
    expect(hash).not.toBe('ClaveSegura123');
    await expect(hasher.verificar(hash, 'ClaveSegura123')).resolves.toBe(true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const hasher = crearHasherPassword();
    const hash = await hasher.hashear('ClaveSegura123');
    await expect(hasher.verificar(hash, 'OtraClave123')).resolves.toBe(false);
  });
});
