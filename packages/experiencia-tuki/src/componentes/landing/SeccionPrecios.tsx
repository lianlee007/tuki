import React, { useState } from 'react';
import { Check, CreditCard, Sparkles } from 'lucide-react';
import { Boton, BotonCTA, BotonTexto, Contenedor, Seccion } from '../ui';
import { EncabezadoSeccion } from './EncabezadoSeccion';
// @ts-ignore
import { useNavigate } from 'react-router-dom';

interface Plan {
  titulo: string;
  precio: string;
  resumen: string;
  features: string[];
  cta: string;
  /** El plan estrella: se eleva y lleva el único botón relleno de la sección. */
  destacado?: boolean;
  gratis?: boolean;
}

const PLANES: Plan[] = [
  {
    titulo: 'Básico',
    precio: '$0',
    resumen: 'Para empezar online.',
    cta: 'Empezar gratis',
    gratis: true,
    features: [
      'Hasta 10 platos',
      'Pedidos por WhatsApp',
      'Código QR para tus mesas',
      'Descripciones con IA',
      'Tu enlace propio',
    ],
  },
  {
    titulo: 'Profesional',
    precio: '$49.900',
    resumen: 'Para un restaurante que vende todos los días.',
    destacado: true,
    cta: 'Elegir Profesional',
    features: [
      'Todo lo del Básico',
      'Platos ilimitados',
      'Sin marca de TukiTuki',
      'Estadísticas',
      'Galería propia',
    ],
  },
  {
    titulo: 'Empresa',
    precio: '$99.900',
    resumen: 'Para varios locales o una franquicia.',
    cta: 'Elegir Empresa',
    features: [
      'Todo lo del Profesional',
      'Varias sedes',
      'Reservas online',
      'Soporte prioritario',
    ],
  },
];

/**
 * Planes.
 *
 * Tres columnas, sí, pero no tres tarjetas iguales: el plan recomendado se
 * invierte a espresso, se eleva y se lleva el único botón relleno de la
 * sección; los otros dos se quedan en papel y se cierran con un botón de
 * borde. El contraste de material —no un borde de color— es lo que hace que el
 * ojo sepa dónde mirar sin que la sección grite.
 *
 * Se fue la lista de lo que NO incluye cada plan. Decirle a alguien lo que no
 * puede tener es la forma más rápida de enfriar una decisión de compra.
 */
const PlanCard: React.FC<{ plan: Plan; onElegir: (plan: Plan) => void }> = ({ plan, onElegir }) => {
  const destacado = Boolean(plan.destacado);

  return (
    <div
      className={`flex h-full flex-col rounded-[24px] p-6 sm:p-8 ${
        destacado
          ? 'af-tarjeta-alta border border-hearth-espresso bg-hearth-espresso text-hearth-cream dark:border-white/10 dark:bg-hearth-night-oat dark:text-hearth-night-ink'
          : 'af-tarjeta bg-hearth-card dark:bg-hearth-night-card'
      }`}
    >
      <div className="md:min-h-[10rem]">
        <div className="flex items-center justify-between gap-3">
          <h3 className={`text-lg font-bold ${destacado ? 'text-hearth-cream dark:text-hearth-night-ink' : 'text-af-ink'}`}>
            {plan.titulo}
          </h3>
          {destacado && (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-hearth-cream dark:bg-white/10 dark:text-hearth-night-ink">
              Recomendado
            </span>
          )}
        </div>

        <p className="mt-4 flex items-baseline gap-1.5">
          <span className="text-[2.4rem] font-extrabold leading-none tracking-[-0.035em]">
            {plan.precio}
          </span>
          <span
            className={`shrink-0 whitespace-nowrap text-[13px] font-medium ${
              destacado
                ? 'text-hearth-cream/60 dark:text-hearth-night-pebble'
                : 'text-af-ink-secondary'
            }`}
          >
            / mes
          </span>
        </p>

        <p
          className={`mt-3 text-[13px] leading-relaxed ${
            destacado ? 'text-hearth-cream/70 dark:text-hearth-night-pebble' : 'text-af-ink-secondary'
          }`}
        >
          {plan.resumen}
        </p>
      </div>

      <ul
        className={`mt-6 flex-1 space-y-3 border-t pt-6 ${
          destacado ? 'border-white/10' : 'border-af-border/60'
        }`}
      >
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check
              size={15}
              strokeWidth={2.8}
              aria-hidden="true"
              className={`mt-0.5 shrink-0 ${
                destacado ? 'text-hearth-terracotta-soft dark:text-hearth-night-terracotta' : 'text-af-accent-text'
              }`}
            />
            <span
              className={`text-[13px] leading-relaxed ${
                destacado ? 'text-hearth-cream/90 dark:text-hearth-night-ink' : 'text-af-ink'
              }`}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {destacado ? (
          <BotonCTA
            anchoCompleto
            className="!bg-hearth-cream !py-3.5 !text-sm !text-hearth-terracotta-ink hover:!bg-white"
            onClick={() => onElegir(plan)}
          >
            {plan.cta}
          </BotonCTA>
        ) : (
          <Boton
            variante="secundario"
            tamanio="grande"
            anchoCompleto
            className="!border-af-border/80 !bg-transparent !py-3.5 !text-sm !text-af-ink hover:!bg-af-surface"
            onClick={() => onElegir(plan)}
          >
            {plan.cta}
          </Boton>
        )}
        {plan.gratis && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-af-ink-secondary">
            <CreditCard size={12} strokeWidth={2.4} aria-hidden="true" />
            Sin tarjeta de crédito
          </p>
        )}
      </div>
    </div>
  );
};

export const SeccionPrecios: React.FC = () => {
  const navigate = useNavigate();
  const [planPendiente, setPlanPendiente] = useState<Plan | null>(null);

  const elegir = (plan: Plan) => {
    if (plan.gratis) {
      navigate('/auth?mode=register&plan=basico');
      return;
    }
    setPlanPendiente(plan);
  };

  return (
    <Seccion id="precios" padding="mediano" fondo="claro" className="!py-16 md:!py-28">
      <Contenedor maxAncho="grande">
        <div>
          <EncabezadoSeccion
            titulo="Un precio claro, sin sorpresas"
            descripcion="Sin comisión sobre tus ventas. Empieza gratis y cambia cuando quieras."
          />
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-3 md:items-stretch">
          {PLANES.map((plan) => (
            <div key={plan.titulo} className="h-full">
              <PlanCard plan={plan} onElegir={elegir} />
            </div>
          ))}
        </div>
      </Contenedor>

      {planPendiente && (
        <div className="modal-overlay-af" role="dialog" aria-modal="true" aria-label="Plan próximamente">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 cursor-default"
            onClick={() => setPlanPendiente(null)}
          />
          <div className="modal-af relative z-10 mx-4 w-full max-w-sm text-center af-entrada-modal">
            <span className="af-icono mx-auto !flex h-11 w-11">
              <Sparkles size={20} strokeWidth={2} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-[1.35rem] font-bold tracking-[-0.02em] text-af-ink">
              El plan {planPendiente.titulo} llega pronto
            </h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-af-ink-secondary">
              Estamos afinando los últimos detalles. Mientras tanto puedes empezar con el
              plan gratuito, sin tarjeta.
            </p>
            <div className="mt-7 flex flex-col gap-2.5">
              <BotonCTA
                anchoCompleto
                onClick={() => {
                  setPlanPendiente(null);
                  navigate('/auth?mode=register&plan=basico');
                }}
              >
                Empezar gratis
              </BotonCTA>
              <BotonTexto anchoCompleto onClick={() => setPlanPendiente(null)}>
                Volver a los planes
              </BotonTexto>
            </div>
          </div>
        </div>
      )}
    </Seccion>
  );
};
