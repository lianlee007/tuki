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
    <div role="group" aria-label="Tipo de cuenta" className="mb-6 grid grid-cols-2 gap-2.5">
      {OPCIONES.map(({ tipo, ruta, etiqueta, detalle, Icono }) => {
        const activo = tipo === actual;
        const contenido = (
          <>
            <span className="flex items-center gap-1.5 text-[13px] font-bold leading-tight">
              <Icono size={16} aria-hidden="true" className="shrink-0" />
              {etiqueta}
            </span>
            <span className="mt-0.5 block text-[11px] font-medium leading-snug opacity-80">
              {detalle}
            </span>
          </>
        );

        const clases = `af-pulsar flex min-h-[62px] flex-col justify-center rounded-2xl border px-3 py-2.5 text-left transition-colors ${FOCO} ${
          activo
            ? 'border-af-accent bg-af-accent/10 text-af-accent-text'
            : 'border-black/10 bg-af-ground text-af-ink-secondary hover:border-af-accent/40 hover:text-af-ink dark:border-white/10 dark:bg-[#2C2C2E] dark:hover:text-white'
        }`;

        return activo ? (
          <div key={tipo} aria-current="true" className={clases}>
            {contenido}
            <span className="sr-only">(seleccionado)</span>
          </div>
        ) : (
          <Link
            key={tipo}
            to={`${ruta}${sufijo}`}
            className={clases}
          >
            {contenido}
          </Link>
        );
      })}
    </div>
  );
};
