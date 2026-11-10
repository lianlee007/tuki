import React from 'react';
// @ts-ignore
import { Link, useNavigate } from 'react-router-dom';
import {
  BotonCTA,
  BotonTexto,
  Contenedor,
  MarcaTuki,
  SEO,
  Seccion,
  SimboloTuki,
  ThemeToggle,
} from '../componentes/ui';
import { SeccionHero } from '../componentes/landing/SeccionHero';
import { SeccionBeneficios } from '../componentes/landing/SeccionBeneficios';
import { SeccionDemo } from '../componentes/landing/SeccionDemo';
import { SeccionPortafolio } from '../componentes/landing/SeccionPortafolio';
import { SeccionPasos } from '../componentes/landing/SeccionPasos';
import { SeccionPrecios } from '../componentes/landing/SeccionPrecios';

/**
 * Landing de venta: ahora vive en `/para-restaurantes`.
 *
 * Desde el giro social, la portada de TukiTuki es Descubrir; esta página es la
 * que le habla a quien tiene un restaurante. El orden es el de una
 * conversación, no el de un índice: qué es (héroe), por qué me conviene
 * (beneficios), cómo se ve lo mío (demostración, solo escritorio), quién más
 * lo usa (prueba social), cuánto cuesta el esfuerzo (tres pasos), cuánto cuesta
 * el dinero (planes) y qué hago ahora (cierre).
 *
 * La barra es deliberadamente mínima: marca, entrar y empezar. El menú
 * hamburguesa y los enlaces a secciones de esta misma página se fueron porque
 * no llevaban a ningún sitio nuevo y en el teléfono apretaban la cabecera. Lo
 * que sí es una página distinta —Descubrir, términos, privacidad— vive en el
 * pie.
 *
 * La página lleva el ámbito `.af-landing`, que recalienta la paleta (papel
 * crudo y acento terracota en vez del azul del sistema).
 */
export default function PaginaParaRestaurantes() {
  const navigate = useNavigate();

  return (
    <div className="af-landing min-h-screen overflow-x-hidden bg-af-ground font-jakarta text-af-ink">
      <SEO
        titulo="TukiTuki — La web de tu restaurante, lista hoy"
        descripcion="Menú digital, código QR para las mesas y pedidos que llegan directo a tu WhatsApp. Sin comisiones y sin saber programar."
      />

      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-af-ground focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-af-ink focus:shadow-warm-lg"
      >
        Saltar al contenido
      </a>

      <nav
        aria-label="Principal"
        className="nav-af relative z-50 w-full max-lg:!bg-af-ground max-lg:!backdrop-blur-none lg:fixed lg:top-0"
      >
        <Contenedor maxAncho="grande">
          <div className="flex h-16 items-center justify-between gap-4 lg:h-20">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="af-pulsar flex shrink-0 items-center"
              aria-label="Volver arriba"
            >
              <MarcaTuki tamano={30} titulo="" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden md:block">
                <BotonTexto
                  onClick={() => navigate('/auth')}
                  className="whitespace-nowrap !px-3"
                >
                  Entrar a mi panel
                </BotonTexto>
              </div>

              <BotonCTA
                onClick={() => navigate('/auth?mode=register')}
                className="!px-4 !py-3 !text-sm sm:!px-5"
              >
                <span className="sm:hidden">Empezar</span>
                <span className="hidden sm:inline">Empezar gratis</span>
              </BotonCTA>

              <div className="hidden h-6 items-center lg:flex">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </Contenedor>
      </nav>

      <main id="contenido" className="scroll-mt-20">
        <SeccionHero />
        <SeccionBeneficios />
        <SeccionDemo />
        <SeccionPortafolio />
        <SeccionPasos />
        <SeccionPrecios />

        <Seccion
          padding="mediano"
          fondo="ninguno"
          className="relative overflow-hidden !py-16 bg-hearth-espresso md:!py-28 dark:bg-hearth-night-soft"
        >
          {/* La llama a tamaño de pared. Es la única decoración del cierre y
              está por debajo del 6 % de opacidad, así que no compite con el
              titular ni con el botón. */}
          <div
            aria-hidden="true"
            className="af-marca-agua pointer-events-none absolute -bottom-24 -right-16 hidden md:block"
          >
            <SimboloTuki size={420} />
          </div>

          <Contenedor maxAncho="mediano">
            <div className="relative text-center">
              <h2 className="mx-auto max-w-xl text-balance text-[1.95rem] font-extrabold leading-[1.06] tracking-[-0.035em] text-hearth-cream sm:text-[2.5rem] md:text-[3rem] dark:text-hearth-night-ink">
                Empieza gratis y publica hoy
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-pretty text-[1rem] leading-relaxed text-hearth-cream/70 dark:text-hearth-night-pebble">
                Sin tarjeta y sin compromiso.
              </p>
              <div className="mt-7 flex justify-center">
                <BotonCTA
                  className="!bg-hearth-cream !px-7 !text-hearth-terracotta-ink hover:!bg-white"
                  onClick={() => navigate('/auth?mode=register')}
                >
                  Crear mi restaurante
                </BotonCTA>
              </div>
            </div>
          </Contenedor>
        </Seccion>
      </main>

      <footer className="border-t border-af-border/60 bg-af-ground pb-10 pt-12">
        <Contenedor maxAncho="grande">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-10">
            <MarcaTuki
              tamano={26}
              conDescriptor
              descriptor="Webs para restaurantes, hechas en Colombia."
              nombre="TukiTuki"
            />

            <nav
              aria-label="Enlaces del pie"
              className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-af-ink-secondary"
            >
              <Link to="/" className="transition-colors hover:text-af-accent-text">
                Descubrir platos
              </Link>
              <Link to="/terminos" className="transition-colors hover:text-af-accent-text">
                Términos
              </Link>
              <Link to="/privacidad" className="transition-colors hover:text-af-accent-text">
                Privacidad
              </Link>
              <Link to="/auth" className="transition-colors hover:text-af-accent-text">
                Entrar a mi panel
              </Link>
            </nav>
          </div>

          <div className="mt-9 flex flex-col gap-4 border-t border-af-border/60 pt-6 text-xs text-af-ink-secondary sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} TukiTuki Inc. Todos los derechos reservados.</p>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="flex items-center gap-2 lg:hidden">
                <span>Tema</span>
                <ThemeToggle />
              </div>
              <span className="inline-flex items-center gap-1.5">
                Hecho en Colombia
                <span className="h-1 w-1 rounded-full bg-af-accent" aria-hidden="true" />
              </span>
            </div>
          </div>
        </Contenedor>
      </footer>
    </div>
  );
}
