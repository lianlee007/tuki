import React from 'react';
import { Palette, Share2, UtensilsCrossed } from 'lucide-react';
import { Contenedor, Seccion } from '../ui';
import { EncabezadoSeccion } from './EncabezadoSeccion';

const PASOS = [
  {
    titulo: 'Elige tu estilo',
    texto: 'Elige plantilla y colores.',
    Icono: Palette,
  },
  {
    titulo: 'Sube tu carta',
    texto: 'Sube tus platos y fotos. La IA escribe las descripciones.',
    Icono: UtensilsCrossed,
  },
  {
    titulo: 'Comparte y vende',
    texto: 'Comparte tu enlace y tu QR. Los pedidos llegan a WhatsApp.',
    Icono: Share2,
  },
];

/**
 * Cómo funciona.
 *
 * Tres pasos y nada más. Sin números visibles: numerar los pasos (01/02/03) es
 * el recurso más gastado del género y no aporta información —el orden ya lo da
 * la lectura—, así que cada paso se reconoce por su icono. El orden del
 * documento sigue siendo una lista ordenada para los lectores de pantalla.
 *
 * Va en un solo panel con separadores de un pelo, como el asistente de
 * configuración de macOS: tres columnas que se leen como un objeto, no como
 * tres tarjetas sueltas. Y a lo ancho, para no repetir la forma de las
 * secciones vecinas, que son de dos columnas.
 */
export const SeccionPasos: React.FC = () => (
  <Seccion id="como-funciona" padding="mediano" className="!py-14 md:!py-24">
    <Contenedor maxAncho="grande">
      <div>
        <EncabezadoSeccion
          titulo="Publica tu menú en tres pasos"
          descripcion="Si sabes usar WhatsApp, sabes usar TukiTuki."
        />
      </div>

      <div>
        <div className="af-tarjeta mt-10 rounded-[24px] bg-hearth-card dark:bg-hearth-night-card">
          <ol className="grid divide-y divide-af-border/60 md:grid-cols-3 md:divide-x md:divide-y-0">
            {PASOS.map(({ titulo, texto, Icono }) => (
              <li key={titulo} className="p-5 sm:p-6">
                <span className="af-icono h-10 w-10" aria-hidden="true">
                  <Icono size={18} strokeWidth={2} />
                </span>
                <h3 className="mt-3.5 text-[1rem] font-bold leading-snug text-af-ink">{titulo}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-af-ink-secondary">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Contenedor>
  </Seccion>
);
