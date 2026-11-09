
import React, { useState, useEffect } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';

interface ImagenInteligenteProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined; // Permitir null/undefined explícitamente
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto' | string;
  fallbackSrc?: string;
}

export const ImagenInteligente: React.FC<ImagenInteligenteProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'auto',
  fallbackSrc,
  ...props
}) => {
  const [estado, setEstado] = useState<'cargando' | 'completo' | 'error'>('cargando');
  const [srcActual, setSrcActual] = useState<string>('');

  useEffect(() => {
    // Si la URL no existe, es vacía o nula, mostramos el estado "sin imagen"
    // sin pedir nada por red (evita <img src=""> y peticiones fallidas).
    if (!src || src.trim() === '') {
      setEstado('error');
      setSrcActual(fallbackSrc ?? '');
      return;
    }

    setEstado('cargando');
    setSrcActual(src);
  }, [src, fallbackSrc]);

  const handleLoad = () => {
    setEstado('completo');
  };

  const handleError = () => {
    if (estado !== 'error') {
        setEstado('error');
        setSrcActual(fallbackSrc ?? '');
    }
  };

  // Determinar clases de aspecto
  let ratioClass = '';
  if (aspectRatio === 'square') ratioClass = 'aspect-square';
  else if (aspectRatio === 'video') ratioClass = 'aspect-video';

  return (
    <div className={`relative overflow-hidden bg-af-ink/[0.06] ${ratioClass} ${className}`}>
      {/* Skeleton Loader / Error State */}
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center bg-af-ink/[0.06] transition-opacity duration-500 ${estado === 'completo' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        {estado === 'cargando' && (
           <div className="w-full h-full animate-pulse bg-af-ink/[0.08] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-af-ink-secondary animate-spin opacity-30" />
           </div>
        )}
        {estado === 'error' && (
           <div className="flex flex-col items-center text-af-ink-secondary opacity-60">
              <ImageOff size={24} opacity={0.6} />
           </div>
        )}
      </div>

      {/* Imagen Real */}
      {srcActual && (
      <img
        src={srcActual}
        alt={alt}
        loading="lazy"
        draggable={false}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover select-none transition-[transform,opacity,filter] duration-500 ease-out ${estado === 'completo' ? 'scale-100 blur-0 opacity-100' : 'scale-[1.03] blur-md opacity-0'}`}
        {...props}
      />
      )}
    </div>
  );
};
