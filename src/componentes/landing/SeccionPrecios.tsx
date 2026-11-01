import React, { useState } from 'react';
import { Check, CreditCard } from 'lucide-react';
import { Boton, BotonCTA, BotonTexto, Contenedor, Seccion } from '../ui';
import { Revelar } from './Revelar';
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
    resumen: 'Para empezar y tener presencia online.',
    cta: 'Empezar gratis',
    gratis: true,
    features: [
      'Menú online con hasta 10 platos',
      'Pedidos por WhatsApp',
      'Código QR para tus mesas',
      'Descripciones con IA',
      'Tu enlace tuki.app/tu-restaurante',
    ],
  },
  {
    titulo: 'Profesional',
    precio: '$49.900',
    resumen: 'Para un restaurante que ya vende todos los días.',
    destacado: true,
    cta: 'Elegir Profesional',
    features: [
      'Todo lo del plan Básico',
      'Platos ilimitados',
      'Sin la marca de Tuki',
      'Estadísticas de visitantes',
      'Galería de fotos propia',
    ],
  },
  {
    titulo: 'Empresa',
    precio: '$99.900',
    resumen: 'Para varios locales o una franquicia.',
    cta: 'Elegir Empresa',
    features: [
      'Todo lo del plan Profesional',
      'Varias sedes en una cuenta',
      'Reservas online',
      'Soporte prioritario',
    ],
  },
];

/**
 * Planes.
 *
 * Tres columnas, sí, pero no tres tarjetas iguales: el plan recomendado se eleva
 * (la única sombra de reposo que la casa permite) y se lleva el único botón
 * relleno de la sección; los otros dos se cierran con un enlace de texto. Antes
 * los tres competían por la misma atención y, al ser idénticos, el ojo no sabía
 * dónde mirar.
 *
 * Se fue la lista de lo que NO incluye cada plan. Decirle a alguien lo que no
 * puede tener es la forma más rápida de enfriar una decisión de compra.
 */
const PlanCard: React.FC<{ plan: Plan; onElegir: (plan: Plan) => void }> = ({ plan, onElegir }) => (
  <div
    className={`flex h-full flex-col rounded-[28px] bg-hearth-card p-8 ring-1 ring-hearth-line/70 dark:bg-hearth-night-card dark:ring-hearth-night-line/80 ${
      plan.destacado
        ? 'shadow-warm-xl dark:shadow-warm-dark'
        : ''
    }`}
  >
    {/* El alto fijo del bloque superior mantiene las cinco listas alineadas
        entre columnas aunque los resúmenes midan distinto. */}
    <div className="min-h-[9.5rem]">
      <h3
        className={`text-xl font-semibold ${
          plan.destacado ? 'text-af-accent-text' : 'text-af-ink'
        }`}
      >
        {plan.titulo}
      </h3>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tracking-tight text-af-ink">{plan.precio}</span>
        <span className="shrink-0 whitespace-nowrap text-sm font-medium text-af-ink-secondary">/ mes</span>
      </p>
      <p className="mt-3 text-sm leading-relaxed text-af-ink-secondary">{plan.resumen}</p>
    </div>

    <ul className="flex-1 space-y-3.5">
      {plan.features.map((f) => (
        <li key={f} className="flex items-start gap-3">
          <Check size={16} strokeWidth={2.6} className="mt-0.5 shrink-0 text-af-accent-text" />
          <span className="text-sm leading-relaxed text-af-ink">{f}</span>
        </li>
      ))}
    </ul>

    <div className="mt-9">
      {plan.destacado ? (
        <BotonCTA anchoCompleto onClick={() => onElegir(plan)}>
          {plan.cta}
        </BotonCTA>
      ) : (
        <BotonTexto className="w-full" onClick={() => onElegir(plan)}>
          {plan.cta}
        </BotonTexto>
      )}
      {plan.gratis && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-af-ink-secondary">
          <CreditCard size={12} strokeWidth={2.4} />
          Sin tarjeta de crédito
        </p>
      )}
    </div>
  </div>
);

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
    <Seccion id="precios" padding="grande">
      <Contenedor maxAncho="grande">
        <Revelar>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-af-accent-text">
              Planes
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-af-ink md:text-5xl">
              Un precio claro, sin sorpresas
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-af-ink-secondary">
              Nunca cobramos comisión sobre tus ventas. Empieza gratis y cambia de plan
              cuando quieras.
            </p>
          </div>
        </Revelar>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-3">
          {PLANES.map((plan, i) => (
            <Revelar key={plan.titulo} retraso={i * 70} className="h-full">
              <PlanCard plan={plan} onElegir={elegir} />
            </Revelar>
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
            <h3 className="text-2xl font-semibold text-af-ink">
              El plan {planPendiente.titulo} llega pronto
            </h3>
            <p className="mt-3 leading-relaxed text-af-ink-secondary">
              Estamos afinando los últimos detalles. Mientras tanto puedes empezar con el
              plan gratuito, sin tarjeta.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <BotonCTA
                anchoCompleto
                onClick={() => {
                  setPlanPendiente(null);
                  navigate('/auth?mode=register&plan=basico');
                }}
              >
                Empezar gratis
              </BotonCTA>
              <Boton variante="fantasma" anchoCompleto onClick={() => setPlanPendiente(null)}>
                Volver a los planes
              </Boton>
            </div>
          </div>
        </div>
      )}
    </Seccion>
  );
};
