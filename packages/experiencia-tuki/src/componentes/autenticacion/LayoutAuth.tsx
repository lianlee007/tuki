import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle, Logo, PalabraTuki } from '../ui';
import { FOCO } from '../descubrir/estilos';

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

/**
 * La puerta de acceso.
 *
 * En móvil el formulario manda: una cabecera fina con la salida y el tema, una
 * presentación de tres líneas y el formulario a un toque de distancia. La
 * composición de dos columnas con la marca grande se reserva para escritorio,
 * donde sí hay sitio para presentar el producto antes de pedir la contraseña.
 */
export const LayoutAuth: React.FC<LayoutAuthProps> = ({
  children,
  titulo,
  subtitulo,
  volverA = '/para-restaurantes',
  etiqueta,
  puntos,
}) => {
  return (
    <div className="min-h-dvh bg-af-ground">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-af-ground/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-white/10 dark:bg-[#161618]/90">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4 md:h-16 md:px-8">
          <Link
            to={volverA}
            aria-label="Volver"
            title="Volver"
            className={`af-pulsar flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-af-surface text-af-ink-secondary transition-colors hover:text-af-ink dark:bg-[#2C2C2E] dark:text-[#A1A1A6] dark:hover:text-white ${FOCO}`}
          >
            <ArrowLeft size={19} aria-hidden="true" />
          </Link>

          <Link
            to="/"
            aria-label="TukiTuki, ir al inicio"
            className={`af-pulsar -m-1 flex items-center gap-2 rounded-xl p-1 ${FOCO}`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-af-accent-solid text-white">
              <Logo size={26} className="h-6 w-6" />
            </span>
            <PalabraTuki nombre="TukiTuki" tamano={18} className="text-af-ink" />
          </Link>

          <div className="ml-auto">
            <ThemeToggle compacto />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 md:px-8 md:py-12">
        <div className="grid gap-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] md:items-center md:gap-12">
          <section className="min-w-0">
            <div className="mb-5 hidden flex-col items-start gap-3 md:flex">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-af-accent-solid text-white">
                <Logo size={44} className="h-11 w-11" />
              </span>
              <PalabraTuki nombre="TukiTuki" tamano={26} className="text-af-ink" />
            </div>

            {etiqueta && (
              <p className="mb-2.5 inline-flex items-center rounded-full bg-af-accent/10 px-2.5 py-1 text-[11.5px] font-bold text-af-accent-text">
                {etiqueta}
              </p>
            )}

            <h1 className="text-balance font-title text-[26px] font-bold leading-[1.12] tracking-[-0.02em] text-af-ink md:text-4xl">
              {titulo}
            </h1>

            <p className="mt-2 max-w-[46ch] text-[13.5px] leading-relaxed text-af-ink-secondary md:mt-4 md:text-base">
              {subtitulo}
            </p>

            {puntos && puntos.length > 0 && (
              <ul className="mt-6 hidden space-y-2.5 md:block">
                {puntos.map((punto) => (
                  <li
                    key={punto}
                    className="flex items-start gap-2.5 text-sm font-medium text-af-ink-secondary"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-af-accent-solid"
                    />
                    {punto}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="min-w-0 rounded-[24px] bg-af-surface p-4 ring-1 ring-black/[0.05] md:rounded-[28px] md:p-8 dark:bg-[#1C1C1E] dark:ring-white/10">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
};
