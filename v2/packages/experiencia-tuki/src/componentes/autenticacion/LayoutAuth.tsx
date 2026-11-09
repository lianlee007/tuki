import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle, Logo } from '../ui';

interface LayoutAuthProps {
  children: React.ReactNode;
  titulo: string;
  subtitulo: string;
  /** A dónde lleva la flecha: la portada para comensales, la landing para restaurantes. */
  volverA?: string;
  /** Deja visible de un vistazo si la cuenta es de comensal o de restaurante. */
  etiqueta?: string;
  /** Lo que gana quien crea ese tipo de cuenta. Refuerza el papel elegido. */
  puntos?: string[];
}

export const LayoutAuth: React.FC<LayoutAuthProps> = ({
  children,
  titulo,
  subtitulo,
  volverA = '/para-restaurantes',
  etiqueta,
  puntos,
}) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-af-ground p-4 pt-20 md:p-8">
      {/* Botón Regresar Absoluto */}
      <div className="absolute left-6 top-6 z-50">
        <Link
          to={volverA}
          aria-label="Volver"
          className="af-pulsar flex rounded-full bg-af-surface p-3 text-af-ink-secondary transition-colors hover:text-af-ink"
        >
          <ArrowLeft size={20} />
        </Link>
      </div>

      {/* Toggle Tema Absoluto */}
      <div className="absolute right-6 top-6 z-50">
        <ThemeToggle />
      </div>

      {/* Contenedor Principal tipo Split en Desktop */}
      <div className="relative flex w-full max-w-5xl animate-fade-in-af flex-col overflow-hidden rounded-[28px] bg-af-surface/30 md:flex-row">
        {/* Panel Izquierdo: Branding e Info */}
        <div className="relative flex flex-col justify-center p-8 md:w-5/12 md:p-12">
          <div className="relative z-10 text-center md:text-left">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[24%] bg-af-accent-solid text-white md:mx-0">
              <Logo size={56} />
            </div>
            {etiqueta && (
              <p className="mb-4 inline-flex items-center rounded-full bg-af-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-af-accent-text">
                {etiqueta}
              </p>
            )}
            <h1 className="mb-4 font-title text-3xl font-bold leading-tight text-af-ink md:text-4xl">
              {titulo}
            </h1>
            <p className="text-lg leading-relaxed text-af-ink-secondary">
              {subtitulo}
            </p>
            {puntos && puntos.length > 0 && (
              <ul className="mt-6 space-y-2 text-left">
                {puntos.map((punto) => (
                  <li
                    key={punto}
                    className="flex items-start gap-2 text-sm font-medium text-af-ink-secondary"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-af-accent-solid"
                    />
                    {punto}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Panel Derecho: Formulario */}
        <div className="relative flex flex-col justify-center bg-af-ground p-8 md:w-7/12 md:p-12">
          {children}
        </div>
      </div>
    </div>
  );
};
