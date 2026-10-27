import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * Aparición al entrar en pantalla.
 *
 * Solo se usa en la landing: es una superficie de Persuade que el visitante ve
 * una vez, así que el escalonamiento de entradas cae dentro del presupuesto de
 * «primera impresión». Nunca en el panel ni en el menú público, donde el
 * usuario repite la tarea cien veces al día.
 *
 * NO usa `IntersectionObserver`, a propósito. El observador solo avisa cuando
 * la intersección cruza su umbral: si el visitante baja deprisa —o salta a una
 * ancla— y el bloque entra y sale de la ventana entre dos fotogramas, no avisa
 * nunca, y el bloque se queda con opacidad 0 para siempre. Un bloque invisible
 * es el peor fallo posible en una página de venta. Un barrido con
 * `getBoundingClientRect` desde un único escucha de `scroll` compartido cuesta
 * once medidas por fotograma y no deja a nadie atrás: lo que ya quedó por
 * encima también cuenta como «asomado» y se revela sin que llegue a verse el
 * movimiento.
 *
 * Es a prueba de fallos, además: los hijos se pintan visibles y solo se esconden
 * si hay JS. Si el script no corre, el contenido se ve igual.
 *
 * `prefers-reduced-motion` quita el desplazamiento (ver `apple-tokens.css`), así
 * que en ese caso queda un fundido corto en vez de un movimiento.
 */

interface Pendiente {
  nodo: HTMLElement;
  mostrar: () => void;
}

/** Elementos que aún esperan su turno, compartidos por toda la página. */
const pendientes = new Set<Pendiente>();
let enganchado = false;

/** ¿Asoma ya por el 92 % de la ventana (o quedó por encima)? */
const asoma = (nodo: HTMLElement) =>
  nodo.getBoundingClientRect().top < window.innerHeight * 0.92;

/**
 * Barrido directo, sin `requestAnimationFrame`.
 *
 * Agrupar por fotograma es lo habitual, pero en una pestaña que el navegador
 * considera oculta `rAF` se frena o se para en seco, y entonces los bloques se
 * quedan invisibles para siempre. Medir once rectángulos es una lectura barata
 * —no invalida nada, el navegador sirve el diseño ya calculado— y los eventos
 * de `scroll` ya llegan como mucho una vez por fotograma, así que se barre en
 * el acto y no hay ventana en la que perderse.
 */
function barrer() {
  pendientes.forEach((p) => {
    if (asoma(p.nodo)) {
      p.mostrar();
      pendientes.delete(p);
    }
  });
  if (pendientes.size === 0) desenganchar();
}

function enganchar() {
  if (enganchado) return;
  enganchado = true;
  window.addEventListener('scroll', barrer, { passive: true });
  window.addEventListener('resize', barrer);
  /* Al volver a la pestaña hay que mirar otra vez: puede haber quedado algo a
     la vista sin que nadie haya hecho scroll. */
  document.addEventListener('visibilitychange', barrer);
}

function desenganchar() {
  if (!enganchado) return;
  enganchado = false;
  window.removeEventListener('scroll', barrer);
  window.removeEventListener('resize', barrer);
  document.removeEventListener('visibilitychange', barrer);
}

export const Revelar: React.FC<{
  children: React.ReactNode;
  /** Retraso dentro de un grupo, en ms (30–80 ms). */
  retraso?: number;
  className?: string;
  /** Etiqueta a renderizar. Útil para no meter un `div` dentro de un `ul`. */
  as?: 'div' | 'li' | 'section';
}> = ({ children, retraso = 0, className = '', as = 'div' }) => {
  const ref = useRef<HTMLElement>(null);
  const [estado, setEstado] = useState<'inicial' | 'oculto' | 'visible'>('inicial');

  /* `useLayoutEffect` y no `useEffect`: la medida y el escondido tienen que
     ocurrir antes del primer pintado, o el bloque se vería un fotograma entero
     y parpadearía al ocultarse. */
  useLayoutEffect(() => {
    const nodo = ref.current;
    if (!nodo || asoma(nodo)) {
      setEstado('visible');
      return;
    }

    setEstado('oculto');
    const pendiente: Pendiente = { nodo, mostrar: () => setEstado('visible') };
    pendientes.add(pendiente);
    enganchar();

    return () => {
      pendientes.delete(pendiente);
      if (pendientes.size === 0) desenganchar();
    };
  }, []);

  const Etiqueta = as as React.ElementType;
  const clases = [
    'af-revelar',
    /* Solo con este marcador se arman las transiciones: evita el fundido de
       1 a 0 del primer render (ver `apple-tokens.css`). */
    estado === 'oculto' ? 'af-revelar--listo' : '',
    estado === 'visible' ? 'es-visible' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Etiqueta
      ref={ref as React.Ref<never>}
      className={clases}
      style={retraso ? { transitionDelay: `${retraso}ms` } : undefined}
    >
      {children}
    </Etiqueta>
  );
};
