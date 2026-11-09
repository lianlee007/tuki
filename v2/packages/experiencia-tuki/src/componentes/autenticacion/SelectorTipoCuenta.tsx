import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { Store, UtensilsCrossed } from 'lucide-react';

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
    etiqueta: 'Soy comensal',
    detalle: 'Pedir y ver mis pedidos',
    Icono: UtensilsCrossed,
  },
  {
    tipo: 'restaurante',
    ruta: '/auth',
    etiqueta: 'Tengo un restaurante',
    detalle: 'Gestionar mi menú',
    Icono: Store,
  },
];

/**
 * Elige de quién es la cuenta antes de pedir correo y contraseña.
 *
 * Tuki tiene dos públicos y una misma pantalla servía para ambos: quien venía a
 * comer podía acabar con una cuenta de restaurante (y al revés) sin darse
 * cuenta hasta después de confirmar el correo. Este selector hace explícito el
 * papel y permite cambiarlo sin perder lo que se estaba haciendo.
 */
export const SelectorTipoCuenta: React.FC<SelectorTipoCuentaProps> = ({ actual, modo }) => {
  const sufijo = modo === 'registro' ? '?modo=registro' : '?modo=login';

  return (
    <div className="mb-6">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-af-ink-secondary">
        ¿Qué cuenta necesitas?
      </p>
      <div role="tablist" aria-label="Tipo de cuenta" className="grid grid-cols-2 gap-2">
        {OPCIONES.map(({ tipo, ruta, etiqueta, detalle, Icono }) => {
          const activo = tipo === actual;
          const contenido = (
            <>
              <Icono size={18} aria-hidden="true" className="shrink-0" />
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[13px] font-bold">{etiqueta}</span>
                <span className="text-[11px] font-medium opacity-80">{detalle}</span>
              </span>
            </>
          );

          const clases = `flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
            activo
              ? 'border-af-accent/60 bg-af-accent/10 text-af-accent-text'
              : 'border-af/20 bg-af-surface/40 text-af-ink-secondary hover:border-af-accent/40 hover:text-af-ink'
          }`;

          return activo ? (
            <div
              key={tipo}
              role="tab"
              aria-selected="true"
              className={clases}
            >
              {contenido}
              <span className="sr-only">(seleccionado)</span>
            </div>
          ) : (
            <Link
              key={tipo}
              to={`${ruta}${sufijo}`}
              role="tab"
              aria-selected="false"
              className={`${clases} af-pulsar`}
            >
              {contenido}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
