import { useCallback, useEffect, useState } from 'react';

export type Tema = 'light' | 'dark';

const CLAVE = 'tema';

const temaGuardado = (): Tema => {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === 'light' || guardado === 'dark') return guardado;
  } catch {
    /* sin almacenamiento: se queda en claro */
  }
  return 'light';
};

const aplicarTema = (tema: Tema): void => {
  document.documentElement.classList.toggle('dark', tema === 'dark');
  document.documentElement.style.colorScheme = tema === 'dark' ? 'dark' : 'light';
};

/**
 * Tema compartido con el resto de TukiTuki: misma clave (`localStorage.tema`),
 * mismos valores (`light`/`dark`) y misma clase en `<html>`.
 */
export const useTema = () => {
  const [tema, setTema] = useState<Tema>(() => temaGuardado());

  useEffect(() => {
    aplicarTema(tema);
    try {
      localStorage.setItem(CLAVE, tema);
    } catch {
      /* el tema sigue funcionando en memoria */
    }
  }, [tema]);

  const alternar = useCallback(() => {
    setTema((actual) => (actual === 'light' ? 'dark' : 'light'));
  }, []);

  return { tema, alternar };
};
