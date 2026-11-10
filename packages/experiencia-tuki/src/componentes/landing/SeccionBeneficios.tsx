import React from 'react';
import { Check } from 'lucide-react';
import { Contenedor, LogoWhatsApp, Seccion } from '../ui';
import { Revelar } from './Revelar';

const BENEFICIOS = [
  {
    titulo: 'El pedido llega a tu WhatsApp',
    texto: 'El cliente arma el pedido desde tu menú y el mensaje te llega listo. Sin instalar nada.',
  },
  {
    titulo: 'Tu carta, siempre al día',
    texto: 'Cambia un precio o marca un plato agotado en segundos, desde el celular.',
  },
  {
    titulo: 'Descripciones escritas por IA',
    texto: 'Escribe el nombre del plato y la IA redacta la descripción por ti.',
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
 * llegando. Una foto podría ser de cualquier sitio; esto es literalmente lo que
 * va a ver en su teléfono.
 *
 * La tarjeta del pedido es decorativa (`aria-hidden`): un lector de pantalla no
 * debe leer una interfaz falsa. Lo que dice, lo dicen los tres puntos de al
 * lado, que sí son texto real.
 */
export const SeccionBeneficios: React.FC = () => (
  <Seccion id="beneficios" padding="grande" fondo="claro">
    <Contenedor maxAncho="grande">
      <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <Revelar>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-af-accent-text">
            Sin comisiones
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-af-ink md:text-5xl">
            Vende directo, sin comisiones.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-af-ink-secondary">
            Lo que vendes es tuyo. Y todo lo demás de tu restaurante también cabe aquí.
          </p>

          <ul className="mt-10 space-y-7">
            {BENEFICIOS.map((b) => (
              <li key={b.titulo} className="flex gap-4">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-af-accent/10 text-af-accent-text">
                  <Check size={15} strokeWidth={3} />
                </span>
                <span>
                  <h3 className="text-lg font-semibold text-af-ink">{b.titulo}</h3>
                  <p className="mt-1 leading-relaxed text-af-ink-secondary">{b.texto}</p>
                </span>
              </li>
            ))}
          </ul>
        </Revelar>

        <Revelar retraso={90}>
          <div className="mx-auto w-full max-w-sm" aria-hidden="true">
            <div className="rounded-3xl bg-hearth-card p-6 ring-1 ring-hearth-line/80 shadow-warm-lg dark:bg-hearth-night-card dark:ring-hearth-night-line/80 dark:shadow-warm-dark">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-af-ink">
                  <span className="h-2 w-2 rounded-full bg-af-accent" />
                  Pedido nuevo
                </span>
                <span className="text-xs font-medium text-af-ink-secondary">Mesa 4</span>
              </div>

              <ul className="mt-5 space-y-3">
                {PEDIDO.map((p) => (
                  <li key={p.nombre} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-sm text-af-ink">
                      <span className="mr-2 font-semibold text-af-accent-text">{p.cantidad}×</span>
                      {p.nombre}
                    </span>
                    <span className="shrink-0 text-sm font-medium text-af-ink-secondary">
                      {p.precio}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-baseline justify-between">
                <span className="text-sm text-af-ink-secondary">Total</span>
                <span className="text-xl font-bold text-af-ink">$98.000</span>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-af-accent py-3 text-sm font-medium text-white">
                <LogoWhatsApp size={18} />
                Enviar por WhatsApp
              </div>
            </div>
          </div>
        </Revelar>
      </div>
    </Contenedor>
  </Seccion>
);
