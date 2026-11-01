import React from 'react';
import { Sparkles, Store, UtensilsCrossed } from 'lucide-react';
import { ETIQUETA } from './estilos';

interface HeroDescubrirProps {
  totalPlatos: number;
  totalRestaurantes: number;
  totalCocinas: number;
  /** Cocina activa en el filtro; se nombra para que el hero no mienta. */
  cocinaActiva?: string | null;
}

/**
 * La bienvenida de la portada.
 *
 * Una sola tarjeta —no un carrusel— porque aquí se viene a decidir qué comer,
 * no a mirar escaparates. Las cifras son reales: salen del mismo feed que se
 * pinta debajo, así que nunca prometen un catálogo que no existe.
 */
export const HeroDescubrir: React.FC<HeroDescubrirProps> = ({
  totalPlatos,
  totalRestaurantes,
  totalCocinas,
  cocinaActiva,
}) => {
  const cifras = [
    {
      etiqueta: 'Locales',
      valor: totalRestaurantes.toLocaleString('es-CO'),
      Icono: Store,
      tinte:
        'bg-hearth-sage-soft text-hearth-sage-ink dark:bg-hearth-night-sage-soft dark:text-hearth-night-sage-ink',
    },
    {
      etiqueta: 'Platos',
      valor: totalPlatos.toLocaleString('es-CO'),
      Icono: UtensilsCrossed,
      tinte:
        'bg-hearth-terracotta-soft text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink',
    },
    {
      etiqueta: 'Cocinas',
      valor: totalCocinas.toLocaleString('es-CO'),
      Icono: Sparkles,
      tinte:
        'bg-hearth-honey-soft text-hearth-honey-ink dark:bg-hearth-night-honey-soft dark:text-hearth-night-honey-ink',
    },
  ];

  return (
    <section
      aria-labelledby="titulo-portada"
      className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-hearth-card via-hearth-oat/70 to-hearth-terracotta-soft p-6 shadow-warm ring-1 ring-hearth-line/60 sm:p-8 dark:from-hearth-night-card dark:via-hearth-night-soft dark:to-hearth-night-terracotta-soft dark:ring-white/5 dark:shadow-none"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-hearth-terracotta/15 blur-3xl dark:bg-hearth-night-terracotta/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-hearth-honey/10 blur-3xl dark:bg-hearth-night-honey-ink/10"
      />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-hearth-terracotta-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-hearth-terracotta-ink ring-1 ring-hearth-terracotta/15 dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink dark:ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-hearth-terracotta dark:bg-hearth-night-terracotta" />
              Cocina local consciente
            </span>
            {cocinaActiva && (
              <span className="rounded-full bg-hearth-card/90 px-3 py-1 text-[11px] font-bold text-hearth-espresso ring-1 ring-hearth-line/70 dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:ring-hearth-night-line">
                {cocinaActiva}
              </span>
            )}
          </div>

          <h1
            id="titulo-portada"
            className="font-jakarta text-[clamp(1.9rem,4.4vw,2.9rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-hearth-espresso dark:text-hearth-night-ink"
          >
            Explorar cocinas
            <span className="block text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink">
              &amp; restaurantes
            </span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-hearth-pebble sm:text-base dark:text-hearth-night-pebble">
            Conectamos artesanos culinarios con tu mesa en condiciones justas,
            cálidas y transparentes. Busca, guarda y pide sin salir de Tuki.
          </p>
        </div>

        <div
          role="group"
          aria-label="Tamaño del catálogo"
          className="flex w-full items-stretch gap-2 rounded-2xl bg-hearth-card/85 p-2 shadow-warm-subtle ring-1 ring-hearth-line/60 backdrop-blur-md sm:gap-3 lg:w-auto dark:bg-hearth-night-card/85 dark:ring-hearth-night-line/80"
        >
          {cifras.map(({ etiqueta, valor, Icono, tinte }) => (
            <div
              key={etiqueta}
              className="flex flex-1 items-center gap-2 px-2 py-1.5 sm:px-3"
            >
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tinte}`}
              >
                <Icono size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0 leading-none">
                <span className="block text-sm font-extrabold tabular-nums text-hearth-espresso dark:text-hearth-night-ink">
                  {valor}
                </span>
                <span
                  className={`mt-0.5 block truncate ${ETIQUETA} text-[9px] text-hearth-pebble dark:text-hearth-night-pebble`}
                >
                  {etiqueta}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
