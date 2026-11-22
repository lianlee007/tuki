import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { Store, UtensilsCrossed } from 'lucide-react';
import { FOCO } from '../descubrir/estilos';

export type TipoCuenta = 'cliente' | 'restaurante';
export type ModoAcceso = 'login' | 'registro';

interface SelectorTipoCuentaProps {
  /** El papel de la página actual: deja claro a quién le habla el formulario. */
  actual: TipoCuenta;
  /** Se conserva al cambiar de papel para no perder si se venía a registrarse. */
  modo: ModoAcceso;
}

const OPCIONES: Array<{
  tipo: TipoCuenta;
  ruta: string;
  etiqueta: string;
  detalle: string;
  Icono: typeof Store;
}> = [
  {
    tipo: 'cliente',
    ruta: '/entrar',
    etiqueta: 'Comensal',
    detalle: 'Pedir y ver mis pedidos',
    Icono: UtensilsCrossed,
  },
  {
    tipo: 'restaurante',
    ruta: '/auth',
    etiqueta: 'Restaurante',
    detalle: 'Gestionar mi menú',
    Icono: Store,
  },
];

/**
 * Elige de quién es la cuenta antes de pedir correo y contraseña.
 *
 * TukiTuki tiene dos públicos y una misma pantalla servía para ambos: quien venía a
 * comer podía acabar con una cuenta de restaurante (y al revés) sin darse
 * cuenta hasta después de confirmar el correo. Dos opciones grandes, con su
 * detalle debajo, hacen explícito el papel sin gastar una fila de texto.
 */
export const SelectorTipoCuenta: React.FC<SelectorTipoCuentaProps> = ({ actual, modo }) => {
  const sufijo = modo === 'registro' ? '?modo=registro' : '?modo=login';

  return (
    <div
      role="group"
      aria-label="Tipo de cuenta"
      className="mb-6 grid grid-cols-2 gap-1 rounded-[18px] bg-black/[0.035] p-1 ring-1 ring-black/[0.045] dark:bg-white/[0.05] dark:ring-white/10"
    >
      {OPCIONES.map(({ tipo, ruta, etiqueta, detalle, Icono }) => {
        const activo = tipo === actual;
        const contenido = (
          <>
            <span className="flex items-center gap-1.5 text-[12.5px] font-bold leading-tight">
              <Icono
                size={15}
                aria-hidden="true"
                className={`shrink-0 ${activo ? 'text-[#B34A2E] dark:text-[#F08A6A]' : ''}`}
              />
              {etiqueta}
            </span>
            <span className="mt-1 block text-[10.5px] font-medium leading-snug opacity-70">
              {detalle}
            </span>
          </>
        );

        const clases = `af-pulsar flex min-h-[58px] flex-col justify-center rounded-[14px] px-3 py-2.5 text-left transition-all ${FOCO} ${
          activo
            ? 'bg-white text-af-ink shadow-[0_6px_16px_-8px_rgba(43,36,33,0.35)] ring-1 ring-black/[0.04] dark:bg-[#2A2523] dark:text-white dark:ring-white/10'
            : 'text-af-ink-secondary hover:text-af-ink dark:hover:text-white'
        }`;

        return activo ? (
          <div key={tipo} aria-current="true" className={clases}>
            {contenido}
            <span className="sr-only">(seleccionado)</span>
          </div>
        ) : (
          <Link key={tipo} to={`${ruta}${sufijo}`} className={clases}>
            {contenido}
          </Link>
        );
      })}
    </div>
  );
};
