import React, { useState } from 'react';
// @ts-ignore
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Menu, X } from 'lucide-react';
import { BotonCTA, BotonTexto, Contenedor, MarcaTuki, SEO, Seccion, ThemeToggle } from '../componentes/ui';
import { SeccionHero } from '../componentes/landing/SeccionHero';
import { SeccionBeneficios } from '../componentes/landing/SeccionBeneficios';
import { SeccionDemo } from '../componentes/landing/SeccionDemo';
import { SeccionPortafolio } from '../componentes/landing/SeccionPortafolio';
import { SeccionPasos } from '../componentes/landing/SeccionPasos';
import { SeccionPrecios } from '../componentes/landing/SeccionPrecios';

/**
 * Landing de venta: ahora vive en `/para-restaurantes`.
 *
 * Desde el giro social, la portada de TukiTuki es Descubrir; esta página es la que
 * le habla a quien tiene un restaurante. El orden sigue siendo el de una
 * conversación, no el de un índice: qué es (héroe), por qué me conviene
 * (beneficios), cómo se ve lo mío (demostración), quién más lo usa (prueba
 * social), cuánto cuesta el esfuerzo (tres pasos), cuánto cuesta el dinero
 * (planes) y qué hago ahora (cierre).
 *
 * La página lleva el ámbito `.af-landing`, que recalienta la paleta (papel
 * crudo y acento terracota en vez del azul del sistema). Es la decisión de
 * diseño más grande de esta pantalla: el resto de la app tiene que ser neutra
 * porque su color lo pone cada restaurante, pero la landing habla de comida y
 * se puede permitir un tono propio.
 */
const ENLACES = [
  { id: 'beneficios', texto: 'Beneficios' },
  { id: 'ejemplos', texto: 'Ejemplos' },
  { id: 'como-funciona', texto: 'Cómo funciona' },
  { id: 'precios', texto: 'Precios' },
];

export default function PaginaParaRestaurantes() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  /**
   * Los enlaces del menú estaban muertos: `Seccion` recibía el `id` y lo
   * descartaba al pintar el `<section>`, así que `getElementById` devolvía
   * `null` y el `preventDefault` dejaba el clic en nada. Ya lo reenvía.
   */
  const irA = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuAbierto(false);
  };

  return (
    <div className="af-landing min-h-screen overflow-x-hidden bg-af-ground font-jakarta text-af-ink">
      <SEO
        titulo="TukiTuki — La web de tu restaurante, lista hoy"
        descripcion="Menú digital, código QR para las mesas y pedidos que llegan directo a tu WhatsApp. Sin comisiones y sin saber programar."
      />

      <nav className="nav-af fixed top-0 z-50 w-full">
        <Contenedor maxAncho="grande">
          <div className="flex h-16 items-center justify-between sm:h-20 md:h-24">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="af-pulsar flex shrink-0 items-center gap-2.5 sm:gap-3"
              >
                <MarcaTuki tamano={30} />
              </button>

              {/* Las dos portadas del producto. Es el mismo par que ofrece la
                  barra de Descubrir, para que el cambio se lea igual en los dos
                  sentidos y no haya que adivinar dónde está cada cosa. */}
              <nav
                aria-label="Páginas principales"
                className="hidden items-center gap-1 rounded-xl bg-af-surface/80 p-1 ring-1 ring-af-border/70 lg:flex dark:ring-white/10"
              >
                <Link
                  to="/"
                  className="af-pulsar rounded-lg px-3 py-1.5 text-[12.5px] font-bold text-af-ink-secondary transition-colors hover:text-af-ink"
                >
                  Explorar
                </Link>
                <Link
                  to="/para-restaurantes"
                  aria-current="page"
                  className="af-pulsar rounded-lg bg-hearth-card px-3 py-1.5 text-[12.5px] font-bold text-af-accent-text shadow-warm dark:bg-hearth-night-card dark:text-hearth-night-terracotta-ink"
                >
                  Para restaurantes
                </Link>
              </nav>
            </div>

            <div className="hidden items-center gap-8 text-sm font-medium text-af-ink-secondary xl:flex">
              {ENLACES.map((enlace) => (
                <a
                  key={enlace.id}
                  href={`#${enlace.id}`}
                  onClick={(e) => irA(e, enlace.id)}
                  className="whitespace-nowrap py-2 transition-colors hover:text-af-accent-text"
                >
                  {enlace.texto}
                </a>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:ml-0">
              <BotonTexto
                onClick={() => navigate('/auth')}
                className="hidden whitespace-nowrap !px-3 sm:inline-flex"
              >
                Entrar a mi panel
              </BotonTexto>
              <BotonCTA
                onClick={() => navigate('/auth?mode=register')}
                className="!px-4 !py-3 !text-sm sm:!px-6"
              >
                Empezar gratis
              </BotonCTA>
              <div className="hidden h-6 items-center sm:flex">
                <ThemeToggle />
              </div>
              <button
                type="button"
                className="af-pulsar -mr-1 p-2 text-af-ink-secondary xl:hidden"
                onClick={() => setMenuAbierto((v) => !v)}
                aria-expanded={menuAbierto}
                aria-label={menuAbierto ? 'Cerrar el menú' : 'Abrir el menú'}
              >
                {menuAbierto ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </Contenedor>

        {menuAbierto && (
          <div className="af-entrada-velo absolute left-0 top-full flex w-full flex-col gap-1 border-b border-af/40 bg-af-ground p-5 shadow-xl xl:hidden">
            <div className="mb-2 grid grid-cols-2 gap-1 rounded-xl bg-af-surface/80 p-1 ring-1 ring-af-border/70 dark:ring-white/10">
              <Link
                to="/"
                onClick={() => setMenuAbierto(false)}
                className="af-pulsar rounded-lg px-3 py-2 text-center text-sm font-bold text-af-ink-secondary transition-colors hover:text-af-ink"
              >
                Explorar
              </Link>
              <Link
                to="/para-restaurantes"
                aria-current="page"
                onClick={() => setMenuAbierto(false)}
                className="af-pulsar rounded-lg bg-hearth-card px-3 py-2 text-center text-sm font-bold text-af-accent-text shadow-warm dark:bg-hearth-night-card dark:text-hearth-night-terracotta-ink"
              >
                Para restaurantes
              </Link>
            </div>

            {ENLACES.map((enlace) => (
              <a
                key={enlace.id}
                href={`#${enlace.id}`}
                onClick={(e) => irA(e, enlace.id)}
                className="af-pulsar rounded-xl p-3 font-medium text-af-ink hover:bg-af-surface"
              >
                {enlace.texto}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-3 border-t border-af/40 pt-5">
              <BotonTexto onClick={() => navigate('/auth')} className="w-full">
                <LogIn size={18} />
                Entrar a mi panel
              </BotonTexto>
              <BotonCTA anchoCompleto onClick={() => navigate('/auth?mode=register')}>
                Empezar gratis
              </BotonCTA>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-af-ink-secondary">Tema</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>
        <SeccionHero scrollToSection={irA} />
        <SeccionBeneficios />
        <SeccionDemo />
        <SeccionPortafolio />
        <SeccionPasos />
        <SeccionPrecios />

        <Seccion padding="mediano" fondo="ninguno" className="bg-hearth-espresso dark:bg-hearth-night-oat">
          <Contenedor maxAncho="mediano">
            <div className="text-center">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-hearth-terracotta-soft dark:text-hearth-night-terracotta-ink">
                Empieza hoy
              </p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-hearth-cream md:text-4xl dark:text-hearth-night-ink">
                Empieza gratis y publica hoy mismo
              </h2>
              <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-hearth-cream/75 dark:text-hearth-night-pebble">
                Creas tu cuenta, subes tus platos y compartes tu enlace. Sin tarjeta y sin
                compromiso.
              </p>
              <div className="mt-9 flex justify-center">
                <BotonCTA
                  className="!bg-hearth-cream !text-hearth-terracotta-ink hover:!bg-white"
                  onClick={() => navigate('/auth?mode=register')}
                >
                  Crear mi restaurante
                </BotonCTA>
              </div>
            </div>
          </Contenedor>
        </Seccion>
      </main>

      <footer className="bg-af-ground pb-12 pt-16">
        <Contenedor maxAncho="grande">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <MarcaTuki
              tamano={26}
              conDescriptor
              descriptor="Webs para restaurantes, hechas en Colombia."
            />

            <nav className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-af-ink-secondary">
              {ENLACES.map((enlace) => (
                <a
                  key={enlace.id}
                  href={`#${enlace.id}`}
                  onClick={(e) => irA(e, enlace.id)}
                  className="transition-colors hover:text-af-accent-text"
                >
                  {enlace.texto}
                </a>
              ))}
              <Link to="/" className="transition-colors hover:text-af-accent-text">
                Descubrir platos
              </Link>
              <Link to="/terminos" className="transition-colors hover:text-af-accent-text">
                Términos
              </Link>
              <Link to="/privacidad" className="transition-colors hover:text-af-accent-text">
                Privacidad
              </Link>
            </nav>
          </div>

          <p className="mt-12 text-xs text-af-ink-secondary">
            © {new Date().getFullYear()} TukiTuki Inc. Todos los derechos reservados.
          </p>
        </Contenedor>
      </footer>
    </div>
  );
}
