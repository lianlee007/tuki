import React from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Globe2 } from 'lucide-react';
import { BotonCTA, Contenedor, LogoWhatsApp } from '../ui';
import { MarcoTelefono } from './Marcos';
import { MenuDemo } from './MenuDemo';

const TRAMO = (ms: number) => ({ ['--af-retraso' as string]: `${ms}ms` }) as React.CSSProperties;

const PRUEBAS = ['Sin comisiones', 'Listo en 10 minutos', 'Sin tarjeta'];

/**
 * Héroe de la landing.
 *
 * Una sola promesa, una sola acción y el producto a la vista. El teléfono se
 * apoya en un escenario de avena —el mismo gesto que una ventana de macOS sobre
 * el escritorio— y una notificación de pedido se asoma por el canto: escaneas
 * el QR, ves el menú y el pedido llega al WhatsApp.
 *
 * En móvil no hay segunda acción: el botón de «Ver un ejemplo» llevaba a una
 * sección que en el teléfono ya muestra el mismo aparato, así que se fue. Queda
 * un único camino y el titular no compite con nada.
 */
export const SeccionHero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header
      id="inicio"
      className="relative overflow-hidden pb-12 pt-8 sm:pb-20 sm:pt-10 lg:pb-24 lg:pt-32"
    >
      <Contenedor maxAncho="grande">
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          {/* Argumento */}
          <div className="text-center lg:text-left">
            <span
              className="af-subir inline-flex items-center gap-2 rounded-full bg-af-surface/70 px-3.5 py-1.5 text-[12px] font-semibold text-af-accent-text ring-1 ring-af-border/60 dark:bg-hearth-night-card/70 dark:ring-white/10"
              style={TRAMO(0)}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-af-accent" aria-hidden="true" />
              Para restaurantes
            </span>

            <h1
              className="af-subir mt-5 font-jakarta text-[2.3rem] font-extrabold leading-[1.05] tracking-[-0.045em] text-af-ink sm:text-[3.25rem] lg:text-[3.55rem] xl:text-[3.9rem]"
              style={TRAMO(50)}
            >
              {/* Tres líneas fijas: el titular se lee como una portada, no como
                  un párrafo que se recompone según el ancho. A 2,3 rem cada
                  línea cabe incluso en 320 px, así que no hay envolturas
                  huérfanas. */}
              <span className="block">Tu restaurante</span>
              <span className="block">con web propia,</span>
              <span className="block text-af-accent-text">listo esta tarde.</span>
            </h1>

            <p
              className="af-subir mx-auto mt-5 max-w-md text-pretty text-[1rem] leading-relaxed text-af-ink-secondary sm:text-[1.0625rem] lg:mx-0 lg:text-lg"
              style={TRAMO(110)}
            >
              Menú digital, QR para tus mesas y pedidos directo a tu WhatsApp. Sin
              comisiones y sin programar.
            </p>

            <div
              className="af-subir mt-8 flex flex-col items-stretch sm:flex-row sm:items-center sm:justify-center lg:justify-start"
              style={TRAMO(170)}
            >
              <BotonCTA
                className="group w-full !px-6 sm:w-auto"
                onClick={() => navigate('/auth?mode=register')}
                iconoDerecho={
                  <ArrowRight
                    size={17}
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                }
              >
                Crear mi restaurante
              </BotonCTA>
            </div>

            <ul
              className="af-subir mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-[13px] font-medium text-af-ink-secondary sm:text-sm lg:justify-start"
              style={TRAMO(240)}
            >
              {PRUEBAS.map((prueba) => (
                <li key={prueba} className="flex items-center gap-1.5">
                  <Check size={14} strokeWidth={3} className="text-af-accent-text" aria-hidden="true" />
                  {prueba}
                </li>
              ))}
            </ul>
          </div>

          {/* Producto, a la vista antes de cualquier explicación */}
          <div className="af-subir relative mx-auto w-full max-w-[420px] lg:max-w-none" style={TRAMO(130)}>
            <div
              aria-hidden="true"
              className="af-escenario absolute inset-x-2 top-10 bottom-20 hidden rounded-[3rem] lg:block"
            />

            <div className="relative flex justify-center">
              <div aria-hidden="true">
                <MarcoTelefono variante="grande">
                  <MenuDemo nombre="El Fogón de Marta" dispositivo="movil" conEstado prioridad />
                </MarcoTelefono>
              </div>

              {/* La notificación prueba lo que dice el texto: el pedido llega
                  armado al WhatsApp del dueño. Es decorativa, así que queda
                  fuera del árbol de accesibilidad. */}
              <div
                aria-hidden="true"
                className="af-tarjeta absolute -left-16 top-28 hidden w-[212px] rounded-2xl bg-hearth-card p-3.5 xl:block dark:bg-hearth-night-card"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#25D366]/15 text-[#128C4A] dark:text-[#5BD68B]">
                    <LogoWhatsApp size={15} />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-af-ink-secondary">
                    Pedido nuevo
                  </span>
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#25D366]" />
                </div>
                <p className="mt-2.5 text-[13px] font-bold text-af-ink">Mesa 4 · $98.000</p>
                <p className="mt-0.5 text-[11px] leading-snug text-af-ink-secondary">
                  2× Bandeja Paisa · 1× Ajiaco
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center gap-2">
              <span className="hidden max-w-full items-center gap-1.5 rounded-full border border-af-border/70 bg-af-ground/80 px-3 py-1.5 text-[11px] font-semibold text-af-ink-secondary sm:inline-flex">
                <Globe2 size={12} className="shrink-0" aria-hidden="true" />
                <span className="truncate">tukituki.app/tu-restaurante</span>
              </span>
              <p className="text-center text-[13px] text-af-ink-secondary">
                Así lo ven tus clientes al escanear el QR.
              </p>
            </div>
          </div>
        </div>
      </Contenedor>
    </header>
  );
};
