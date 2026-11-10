import React from 'react';
import { Check, MessageCircle, RefreshCw, Sparkles } from 'lucide-react';
import { Contenedor, LogoWhatsApp, Seccion } from '../ui';
import { EncabezadoSeccion } from './EncabezadoSeccion';

const BENEFICIOS = [
  {
    titulo: 'El pedido llega armado a tu WhatsApp',
    texto: 'El cliente elige y el mensaje te llega listo.',
    Icono: MessageCircle,
  },
  {
    titulo: 'Tu carta, siempre al día',
    texto: 'Cambia precios o marca agotados desde el celular.',
    Icono: RefreshCw,
  },
  {
    titulo: 'Descripciones con IA',
    texto: 'Escribe el plato y la IA redacta por ti.',
    Icono: Sparkles,
  },
];

const PEDIDO = [
  { cantidad: 2, nombre: 'Bandeja Paisa', precio: '$70.000' },
  { cantidad: 1, nombre: 'Ajiaco Santafereño', precio: '$28.000' },
];

/**
 * Por qué TukiTuki.
 *
 * El argumento de venta no es «tenemos un panel bonito», es que el pedido
 * acaba en el WhatsApp que el dueño ya usa y que nadie se lleva un porcentaje.
 * Así que el visual no es una foto de un restaurante cualquiera: es el pedido
 * llegando.
 *
 * La lista de la izquierda va con separadores de un pelo, como una lista de
 * ajustes de macOS: tres argumentos seguidos se leen de un vistazo. En móvil
 * se queda solo la tarjeta del pedido; la de «Carta actualizada» repetía un
 * punto que la lista ya cuenta y alargaba la sección sin añadir prueba.
 */
export const SeccionBeneficios: React.FC = () => (
  <Seccion id="beneficios" padding="mediano" fondo="claro" className="!py-14 md:!py-24">
    <Contenedor maxAncho="grande">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_0.92fr] lg:gap-16">
        <div>
          <EncabezadoSeccion
            alineacion="izquierda"
            titulo={
              <>
                Vende directo.
                <br className="hidden sm:block" /> Sin intermediarios.
              </>
            }
          />

          <ul className="mt-8 divide-y divide-af-border/60 border-y border-af-border/60">
            {BENEFICIOS.map(({ titulo, texto, Icono }) => (
              <li key={titulo} className="flex gap-4 py-4 sm:py-5">
                <span className="af-icono h-10 w-10" aria-hidden="true">
                  <Icono size={18} strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <h3 className="text-[1rem] font-bold leading-snug text-af-ink">{titulo}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-af-ink-secondary">{texto}</p>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div
            className="af-tarjeta rounded-[24px] bg-hearth-card p-5 sm:p-6 dark:bg-hearth-night-card"
            aria-hidden="true"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-af-ink-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-af-success" />
                Pedido nuevo
              </span>
              <span className="rounded-full bg-af-surface px-2.5 py-1 text-[11px] font-bold text-af-ink-secondary dark:bg-hearth-night-oat">
                Mesa 4
              </span>
            </div>

            <ul className="mt-4 space-y-3">
              {PEDIDO.map((p) => (
                <li key={p.nombre} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-af-surface text-[11px] font-bold text-af-accent-text dark:bg-hearth-night-oat">
                    {p.cantidad}×
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-af-ink">
                    {p.nombre}
                  </span>
                  <span className="shrink-0 text-[13px] font-medium text-af-ink-secondary">
                    {p.precio}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-baseline justify-between border-t border-af-border/70 pt-4">
              <span className="text-[13px] text-af-ink-secondary">Total</span>
              <span className="text-[1.35rem] font-extrabold tracking-tight text-af-ink">
                $98.000
              </span>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-af-accent-solid py-3 text-[13px] font-semibold text-white">
              <LogoWhatsApp size={17} />
              Enviar por WhatsApp
            </div>
          </div>

          <div
            className="af-tarjeta mt-3 hidden rounded-2xl bg-hearth-card p-4 sm:ml-7 sm:block dark:bg-hearth-night-card"
            aria-hidden="true"
          >
            <div className="flex items-center gap-3">
              <span className="af-icono h-9 w-9">
                <Check size={16} strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold leading-tight text-af-ink">
                  Carta actualizada
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-af-ink-secondary">
                  Bandeja Paisa · hace un momento
                </span>
              </span>
              <span className="inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-af-success/20 p-0.5">
                <span className="ml-auto h-4 w-4 rounded-full bg-af-success" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Contenedor>
  </Seccion>
);
