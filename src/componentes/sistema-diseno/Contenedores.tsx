import React from 'react';

export const Tarjeta: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  enlace?: boolean;
  sombreado?: boolean;
}> = ({ children, className = '', enlace = false, sombreado = false }) => {
  const base = "card-af transition-all duration-300";
  const clases = enlace 
    ? `${base} card-af-link ${sombreado ? 'shadow-sm hover:shadow-xl dark:hover:shadow-black/30' : ''} ${className}`
    : `${base} ${sombreado ? 'shadow-sm hover:shadow-xl dark:hover:shadow-black/30' : ''} ${className}`;
  
  const Component = enlace ? 'a' : 'div';
  
  return (
    <Component className={clases}>
      {children}
    </Component>
  );
};

export const Contenedor: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  maxAncho?: 'pequeno' | 'mediano' | 'grande' | 'completo';
}> = ({ children, className = '', maxAncho = 'grande' }) => {
  const maxWMap = {
    pequeno: 'max-w-2xl mx-auto',
    mediano: 'max-w-4xl mx-auto',
    grande: 'max-w-7xl mx-auto',
    completo: 'w-full',
  };
  return (
    <div className={`relative z-10 px-6 ${maxWMap[maxAncho]} ${className}`}>
      {children}
    </div>
  );
};

export const Seccion: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: 'pequeno' | 'mediano' | 'grande';
  fondo?: 'claro' | 'oscuro' | 'ninguno';
  /** Ancla de la sección. Se reenvía al `<section>`, que es lo que hacía falta
   *  para que los enlaces del menú funcionaran: antes se recibía y se perdía. */
  id?: string;
}> = ({ children, className = '', padding = 'grande', fondo = 'ninguno', id }) => {
  const padMap = {
    pequeno: 'py-12 md:py-16',
    mediano: 'py-20 md:py-28',
    grande: 'py-32 md:py-40',
  };
  const bgMap = {
    /* Una sola fuente de color: el canal `surface`. Antes el modo oscuro caía a
       `gray-900`, un gris azulado ajeno a la paleta que en la landing (cálida)
       se veía como una mancha fría. Al 60 % la banda se distingue del papel sin
       convertirse en un bloque. */
    claro: 'bg-af-surface/60',
    oscuro: 'bg-af-surface',
    ninguno: '',
  };
  return (
    <section
      id={id}
      /* `scroll-mt-28` (112 px) deja el título por debajo de la barra fija, que
         mide 96 px como mucho en la landing. Sin esto el ancla aterriza con el
         titular tapado. */
      className={`relative ${id ? 'scroll-mt-28' : ''} ${padMap[padding]} ${bgMap[fondo]} ${className}`}
    >
      {children}
    </section>
  );
};
