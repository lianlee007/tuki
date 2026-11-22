import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type Tema = 'light' | 'dark';

interface TemaContextType {
  tema: Tema;
  toggleTema: () => void;
}

const TemaContext = createContext<TemaContextType>({
  tema: 'light',
  toggleTema: () => {},
});

export const useTema = () => useContext(TemaContext);

/**
 * Clase que abre la ventana de cruce de color. Mientras está puesta en <html>,
 * todo el árbol interpola sus colores en vez de saltar (ver `.af-tema-cambiando`
 * en `sistema-visual.css`). Sin ella, cambiar de modo se ve tosco.
 */
const CLASE_CAMBIO = 'af-tema-cambiando';
/** Margen sobre la duración real para no retirar la clase a mitad de camino. */
const MARGEN_MS = 60;
/** Respaldo si la variable de CSS no se puede leer. */
const DURACION_POR_DEFECTO = 280;

export const ProveedorTema: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // El tema lo elige el usuario (no el sistema): se recuerda en localStorage y
  // se respeta solo lo elegido, para que el visitante de un restaurante no
  // cambie de modo porque el móvil haya cambiado al anochecer.
  const [tema, setTema] = useState<Tema>(() => {
    const guardado = localStorage.getItem('tema');
    if (guardado === 'light' || guardado === 'dark') return guardado;
    return 'light';
  });

  const temporizador = useRef<number | undefined>(undefined);

  useEffect(() => {
    const raiz = window.document.documentElement;

    const aplicar = () => {
      raiz.classList.remove('light', 'dark');
      raiz.classList.add(tema);
      localStorage.setItem('tema', tema);
    };

    // Si nada ha pintado el modo todavía (no hay nada guardado), se aplica sin
    // ventana: no hay nada que cruzar y animarlo sería un parpadeo al abrir. Si
    // ya está puesto —lo dejó el guion de `index.html` antes del primer pintado,
    // o un render anterior— se cruza. Se comprueba en el DOM y no con un `ref`
    // porque en desarrollo los efectos se montan dos veces y un `ref` mentiría.
    const yaAplicado = raiz.classList.contains('light') || raiz.classList.contains('dark');
    if (!yaAplicado) {
      aplicar();
      return;
    }

    const leido = parseInt(getComputedStyle(raiz).getPropertyValue('--af-cambio-tema-ms'), 10);
    const ms = Number.isFinite(leido) && leido > 0 ? leido : DURACION_POR_DEFECTO;

    raiz.classList.add(CLASE_CAMBIO);
    // Forzar el estilo con la ventana ya puesta: si no, el navegador ve la
    // clase y el color nuevo en el mismo cálculo y no hay nada que transicionar.
    void raiz.offsetWidth;
    aplicar();

    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => {
      raiz.classList.remove(CLASE_CAMBIO);
    }, ms + MARGEN_MS);

    return () => {
      window.clearTimeout(temporizador.current);
      raiz.classList.remove(CLASE_CAMBIO);
    };
  }, [tema]);

  const toggleTema = () => {
    setTema((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <TemaContext.Provider value={{ tema, toggleTema }}>
      {children}
    </TemaContext.Provider>
  );
};
