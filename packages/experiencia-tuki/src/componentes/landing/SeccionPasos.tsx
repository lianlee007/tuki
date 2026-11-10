import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Contenedor, Seccion } from '../ui';
import { Revelar } from './Revelar';

const PASOS = [
  {
    titulo: 'Elige tu estilo',
    texto: 'Escoge plantilla y colores. No hace falta diseñar nada.',
  },
  {
    titulo: 'Sube tu carta',
    texto: 'Agrega tus platos y sus fotos. Si no quieres escribir, la IA lo hace por ti.',
  },
  {
    titulo: 'Comparte y vende',
    texto: 'Tu enlace y tu QR quedan listos. Los pedidos llegan a tu WhatsApp.',
  },
];

/**
 * Cómo funciona.
 *
 * Tres pasos y nada más. Sin números y sin tarjetas: numerar los pasos (01/02/03)
 * es el recurso más gastado del género y no aporta información —el orden ya lo
 * dice la flecha—, y meter cada paso en su tarjeta convierte una frase en un
 * objeto que hay que recorrer con la vista.
 *
 * Va a lo ancho justamente para no repetir la forma de las secciones vecinas,
 * que son de dos columnas.
 */
export const SeccionPasos: React.FC = () => (
  <Seccion id="como-funciona" padding="grande" fondo="claro">
    <Contenedor maxAncho="grande">
      <Revelar>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-af-accent-text">
            Tres pasos
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-af-ink md:text-5xl">
            Publicar tu menú es lo más fácil del día
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-af-ink-secondary">
            Si sabes usar WhatsApp, sabes usar TukiTuki. No hay nada que instalar ni que
            programar.
          </p>
        </div>
      </Revelar>

      <div className="mt-16 flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center md:gap-6">
        {PASOS.map((paso, i) => (
          <React.Fragment key={paso.titulo}>
            {i > 0 && (
              <ArrowRight
                size={20}
                strokeWidth={2}
                aria-hidden="true"
                className="shrink-0 rotate-90 text-af-ink-secondary/40 md:mt-2 md:rotate-0"
              />
            )}
            <Revelar retraso={i * 70} className="md:w-56">
              <h3 className="text-center text-lg font-semibold text-af-ink md:text-left">
                {paso.titulo}
              </h3>
              <p className="mt-2 text-center leading-relaxed text-af-ink-secondary md:text-left">
                {paso.texto}
              </p>
            </Revelar>
          </React.Fragment>
        ))}
      </div>
    </Contenedor>
  </Seccion>
);
