import React from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { BotonCTA, BotonTexto, Contenedor } from '../ui';
import { MarcoTelefono } from './Marcos';
import { MenuDemo } from './MenuDemo';

interface Props {
  scrollToSection: (e: React.MouseEvent, id: string) => void;
}

const TRAMO = (ms: number) => ({ ['--af-retraso' as string]: `${ms}ms` }) as React.CSSProperties;

/**
 * Héroe de la landing.
 *
 * Una sola promesa, una sola acción y el producto a la vista. La prueba social
 * va como tres marcas cortas, no como una fila de sellos: el visitante la lee de
 * reojo y sigue al botón.
 *
 * El titular ya no rota cada cinco segundos. Un H1 que cambia solo obliga a
 * esperar a leerlo, mueve el texto justo cuando el visitante empieza a
 * interpretarlo y no aporta nada que no diga ya el subtítulo.
 */
export const SeccionHero: React.FC<Props> = ({ scrollToSection }) => {
  const navigate = useNavigate();

  return (
    <header id="inicio" className="relative overflow-hidden pb-20 pt-28 md:pb-28 md:pt-36">
      <Contenedor maxAncho="grande">
        <div className="grid items-center gap-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8">
          {/* Argumento */}
          <div className="text-center lg:text-left">
            <h1
              className="af-subir text-[2.45rem] font-bold leading-[1.06] tracking-tight text-af-ink sm:text-[3.4rem] lg:text-[4rem]"
              style={TRAMO(0)}
            >
              Tu restaurante con web propia,
              <br className="hidden sm:block" />{' '}
              <span className="text-af-accent-text">listo esta tarde.</span>
            </h1>

            <p
              className="af-subir mx-auto mt-7 max-w-xl text-lg leading-relaxed text-af-ink-secondary lg:mx-0"
              style={TRAMO(80)}
            >
              Menú digital, código QR para las mesas y pedidos que llegan directo a tu
              WhatsApp. Sin comisiones y sin escribir una línea de código.
            </p>

            <div
              className="af-subir mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start"
              style={TRAMO(160)}
            >
              <BotonCTA onClick={() => navigate('/auth?mode=register')}>
                Crear mi restaurante
              </BotonCTA>
              <BotonTexto onClick={(e) => scrollToSection(e, 'ejemplos')}>
                Ver un ejemplo
              </BotonTexto>
            </div>

            <ul
              className="af-subir mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-af-ink-secondary lg:justify-start"
              style={TRAMO(240)}
            >
              {['Sin comisiones', 'Listo en 10 minutos', 'Sin tarjeta de crédito'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check size={15} strokeWidth={2.6} className="text-af-accent-text" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Producto, a la vista antes de cualquier explicación */}
          <div className="af-subir" style={TRAMO(140)}>
            <MarcoTelefono>
              <MenuDemo nombre="El Fogón de Marta" dispositivo="movil" conEstado />
            </MarcoTelefono>
            <p className="mt-8 text-center text-sm text-af-ink-secondary">
              Así lo ven tus clientes al escanear el código QR de la mesa.
            </p>
          </div>
        </div>
      </Contenedor>
    </header>
  );
};
