import React from 'react';
import { Lock } from 'lucide-react';

export type Dispositivo = 'movil' | 'tablet' | 'pc';

/**
 * Marcos de dispositivo para la demostración de la landing.
 *
 * Son objetos físicos: un teléfono es negro tenga la pantalla encendida o
 * apagada, así que el chasis usa un negro cálido FIJO y no un token `af` (que
 * en modo oscuro se volvería blanco y el aparato parecería de porcelana). Lo
 * que va dentro, en cambio, sí es del visitante y sí cambia con el tema.
 *
 * Nada de degradados metálicos ni reflejos: la única profundidad es una sombra
 * suave debajo, porque el aparato flota sobre el papel y la casa solo admite
 * sombra en lo que flota de verdad.
 */
const CHASIS = '#1C1917';
const SALIENTE = '#26221F';
const SOMBRA = 'shadow-[0_45px_80px_-45px_rgba(28,25,23,0.65)]';

export const MarcoTelefono: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className={`relative mx-auto h-[560px] w-[268px] rounded-[44px] p-[10px] ${SOMBRA}`}
    style={{ backgroundColor: CHASIS }}
  >
    <div className="relative h-full w-full overflow-hidden rounded-[35px] bg-af-ground">
      {/* Isla dinámica: flota sobre la fila de estado que dibuja el menú. */}
      <div
        className="pointer-events-none absolute left-1/2 top-[9px] z-20 h-[20px] w-[74px] -translate-x-1/2 rounded-full"
        style={{ backgroundColor: '#0B0A09' }}
      />
      <div className="h-full w-full">{children}</div>
    </div>
  </div>
);

export const MarcoTablet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className={`relative mx-auto h-[500px] w-[660px] rounded-[26px] p-[14px] ${SOMBRA}`}
    style={{ backgroundColor: CHASIS }}
  >
    <div className="relative h-full w-full overflow-hidden rounded-[13px] bg-af-ground">
      <div
        className="pointer-events-none absolute left-1/2 top-[5px] z-20 h-[4px] w-[4px] -translate-x-1/2 rounded-full"
        style={{ backgroundColor: SALIENTE }}
      />
      {children}
    </div>
  </div>
);

/**
 * Portátil: marco + barra de navegador + base.
 *
 * La barra de navegador no es decoración: es donde se lee `tuki.app/tu-slug`,
 * que es justo la promesa de la sección — tu propia dirección, no un enlace
 * dentro de otra plataforma.
 */
export const MarcoPortatil: React.FC<{ url: string; children: React.ReactNode }> = ({ url, children }) => (
  <div className={`relative mx-auto w-[780px] ${SOMBRA}`}>
    <div className="rounded-t-[14px] p-[12px] pb-[16px]" style={{ backgroundColor: CHASIS }}>
      <div className="relative h-[440px] overflow-hidden rounded-[7px] bg-af-ground">
        <div className="flex h-9 shrink-0 items-center gap-2 bg-af-surface px-3.5">
          <span className="h-[9px] w-[9px] rounded-full bg-[#FF5F57]" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#FEBC2E]" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#28C840]" />
          <span className="mx-auto flex max-w-[62%] items-center gap-1.5 truncate rounded-md bg-af-ground px-3 py-1 text-[10px] font-medium text-af-ink-secondary">
            <Lock size={9} strokeWidth={2.4} className="shrink-0" />
            <span className="truncate">{url}</span>
          </span>
        </div>
        <div className="h-[calc(100%-2.25rem)]">{children}</div>
      </div>
    </div>
    {/* Base: da el peso que hace que el conjunto se lea como un portátil y no
        como una tablet rara. */}
    <div className="mx-auto h-[13px] w-[856px] rounded-b-[11px]" style={{ backgroundColor: SALIENTE }} />
  </div>
);
