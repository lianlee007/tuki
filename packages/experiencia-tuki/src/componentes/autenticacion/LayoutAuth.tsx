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
 * En escritorio es una pieza editorial: un panel profundo con la marca y el
 * mensaje, y el formulario respirando sobre crema, sin tarjeta dentro de otra
 * tarjeta. En móvil manda el formulario: cabecera mínima, título y campos a un
 * toque, con el mismo aire en los márgenes.
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
    <div className="min-h-dvh bg-[#FBF8F4] text-af-ink dark:bg-[#131110]">
      <div className="grid min-h-dvh w-full lg:grid-cols-[1.05fr_1fr]">
        {/* Panel editorial: solo escritorio. */}
        <aside className="relative hidden flex-col overflow-hidden bg-[#2B2421] lg:flex dark:bg-[#1B1816]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-28 top-1/4 h-[460px] w-[460px] rounded-full bg-[#B34A2E]/30 blur-[130px]"
          />
          <Logo
            size={340}
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-16 h-[340px] w-[340px] text-[#FDFBF7] opacity-[0.05]"
          />

          <div className="relative mx-auto flex h-full w-full max-w-[640px] flex-col px-12 py-11">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DD6B4D] text-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.55)]">
                <Logo size={27} className="h-7 w-7" aria-hidden="true" />
              </span>
              <PalabraTuki nombre="TukiTuki" tamano={21} className="text-[#FDFBF7]" />
            </div>

            <div className="my-auto max-w-[30rem] py-12">
              {etiqueta && (
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F0A48C]">
                  {etiqueta}
                </p>
              )}
              <h1 className="mt-5 text-balance font-serif text-[46px] leading-[1.03] tracking-[-0.025em] text-[#FDFBF7]">
                {titulo}
              </h1>
              <p className="mt-6 max-w-[36ch] text-[15px] leading-[1.65] text-[#FDFBF7]/60">
                {subtitulo}
              </p>

              {puntos && puntos.length > 0 && (
                <ul className="mt-10 border-t border-white/10">
                  {puntos.map((punto, indice) => (
                    <li
                      key={punto}
                      className="flex items-baseline gap-4 border-b border-white/10 py-3.5 text-[13.5px] font-medium text-[#FDFBF7]/75"
                    >
                      <span className="font-serif text-[13px] italic text-[#DD6B4D]">
                        {String(indice + 1).padStart(2, '0')}
                      </span>
                      {punto}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FDFBF7]/35">
              Menú digital · QR · Pedidos por WhatsApp
            </p>
          </div>
        </aside>

        {/* Columna del formulario. */}
        <main className="relative flex min-h-dvh flex-col px-5 pb-8 pt-4 sm:px-9 lg:border-l lg:border-black/[0.06] lg:px-14 lg:py-10 dark:lg:border-white/10">
          <div className="flex items-center justify-between">
            <Link
              to={volverA}
              aria-label="Volver"
              title="Volver"
              className={`af-pulsar flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-white/70 text-af-ink-secondary transition-colors hover:text-af-ink dark:border-white/10 dark:bg-white/[0.04] dark:hover:text-white ${FOCO}`}
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </Link>

            <Link
              to="/"
              aria-label="TukiTuki, ir al inicio"
              className={`af-pulsar flex items-center gap-2 rounded-xl p-1 lg:hidden ${FOCO}`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#DD6B4D] text-white">
                <Logo size={22} className="h-5 w-5" aria-hidden="true" />
              </span>
              <PalabraTuki nombre="TukiTuki" tamano={17} className="text-af-ink" />
            </Link>

            <ThemeToggle conFondo />
          </div>

          <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-8 lg:py-10">
            <div className="mb-7 lg:hidden">
              {etiqueta && (
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#8A311A] dark:text-[#F7B29C]">
                  {etiqueta}
                </p>
              )}
              <h1 className="mt-2.5 text-balance font-serif text-[30px] leading-[1.06] tracking-[-0.02em] text-af-ink">
                {titulo}
              </h1>
              <p className="mt-3 text-[13.5px] leading-relaxed text-af-ink-secondary">
                {subtitulo}
              </p>
            </div>

            <div className="auth-acceso">{children}</div>
          </div>

          <p className="mx-auto w-full max-w-[420px] text-center text-[10.5px] font-medium tracking-[0.04em] text-af-ink-secondary/60">
            © TukiTuki · Hecho para restaurantes locales
          </p>
        </main>
      </div>
    </div>
  );
};
