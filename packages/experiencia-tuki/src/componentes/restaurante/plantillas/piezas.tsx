/**
 * Descripción: piezas compartidas por los arquetipos de menú.
 *
 * Nueve estructuras distintas deben compartir lo que NO puede variar: el hueco
 * de un plato sin foto, el gesto de pedir, el estado "agotado" y el estado
 * "local cerrado". La estructura se diferencia; el comportamiento, no.
 */
import React from 'react';
import type { EstilosComunes } from '../PlantillaRestaurante';
import { Platillo } from '../../../tipos';
import { ImagenInteligente } from '../../ui';
import { Lock, Plus, Star, UtensilsCrossed } from 'lucide-react';

/** Foto del platillo, o el hueco con su icono cuando todavía no hay imagen. */
export const FotoPlatillo: React.FC<{
  platillo: Platillo;
  estilos: EstilosComunes;
  clase?: string;
  icono?: number;
}> = ({ platillo, estilos, clase = 'w-full h-full', icono = 28 }) => {
  if (platillo.imagen_url) {
    return <ImagenInteligente src={platillo.imagen_url} alt={platillo.nombre} className={clase} />;
  }
  return (
    <div className={`${clase} flex items-center justify-center`} style={{ color: estilos.muted, opacity: 0.4 }}>
      <UtensilsCrossed size={icono} />
    </div>
  );
};

/**
 * Toda la tarjeta abre el detalle. Es un botón transparente real, no un
 * `onClick` en un `div`: así el menú se recorre con el teclado y el foco se ve.
 * `radio` debe igualar el de la tarjeta para que el anillo siga las esquinas.
 */
export const AbrirPlatillo: React.FC<{
  platillo: Platillo;
  onVer: (p: Platillo) => void;
  radio?: string;
}> = ({ platillo, onVer, radio = '' }) => (
  <button
    type="button"
    onClick={() => onVer(platillo)}
    aria-label={`Ver ${platillo.nombre}`}
    className={`absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-af-accent-text ${radio}`}
  />
);

/** Plato de la casa. Usa el par validado secundario/sobre-secundario. */
export const ChipDestacado: React.FC<{ estilos: EstilosComunes; className?: string; texto?: string }> = ({
  estilos,
  className = '',
  texto = 'Destacado',
}) => (
  <span
    className={`pointer-events-none inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${className}`}
    style={{ backgroundColor: estilos.secondary, color: estilos.onSecondary }}
  >
    <Star size={11} fill="currentColor" /> {texto}
  </span>
);

/** Aviso de agotado. Superficie clara, no un velo negro sobre la foto. */
export const ChipAgotado: React.FC<{ className?: string; texto?: string }> = ({ className = '', texto = 'Agotado' }) => (
  <span
    className={`pointer-events-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border border-af/25 ${className}`}
    style={{ backgroundColor: 'rgb(var(--af-surface-rgb) / 0.96)', color: 'rgb(var(--af-ink-rgb))' }}
  >
    <Lock size={12} /> {texto}
  </span>
);

export type VarianteAgregar = 'solido' | 'suave' | 'texto' | 'cristal';

/**
 * El botón de pedido, en las cuatro intensidades que piden las estructuras.
 * Resuelve de una vez el estado agotado y el local cerrado, para que ninguna
 * plantilla pueda inventarse una versión distinta (ni olvidarse de uno).
 */
export const BotonAgregar: React.FC<{
  platillo: Platillo;
  estilos: EstilosComunes;
  localAbierto: boolean;
  onAgregar: (e: React.MouseEvent) => void;
  variante?: VarianteAgregar;
  /** En pantallas estrechas deja solo el icono. */
  soloIconoEnMovil?: boolean;
  className?: string;
}> = ({ platillo, estilos, localAbierto, onAgregar, variante = 'solido', soloIconoEnMovil = false, className = '' }) => {
  const agotado = !platillo.disponible;
  const cerrado = !localAbierto;
  const bloqueado = agotado || cerrado;

  const aria = agotado
    ? `${platillo.nombre} no está disponible hoy`
    : cerrado
      ? 'El local está cerrado ahora mismo'
      : `Añadir ${platillo.nombre} al pedido`;

  const base = 'af-pulsar shrink-0 inline-flex items-center justify-center gap-1.5 disabled:cursor-not-allowed';
  const glifo = agotado || cerrado ? <Lock size={14} /> : <Plus size={15} strokeWidth={2.6} />;
  const etiqueta = agotado ? 'Agotado' : cerrado ? 'Cerrado' : 'Añadir';

  if (variante === 'texto') {
    return (
      <button
        type="button"
        onClick={onAgregar}
        disabled={bloqueado}
        aria-label={aria}
        className={`${base} text-[12px] font-bold uppercase tracking-[0.06em] disabled:opacity-45 ${className}`}
        style={{ color: agotado ? estilos.danger : estilos.accentText }}
      >
        {agotado || cerrado ? <Lock size={12} /> : <Plus size={13} strokeWidth={2.8} />}
        {agotado ? 'Agotado hoy' : cerrado ? 'Cerrado' : 'Añadir'}
      </button>
    );
  }

  if (variante === 'cristal') {
    return (
      <button
        type="button"
        onClick={onAgregar}
        disabled={bloqueado}
        aria-label={aria}
        className={`${base} px-3.5 py-2 rounded-full text-[13px] font-bold text-white border border-white/30 backdrop-blur-md ${className}`}
        style={{ backgroundColor: bloqueado ? 'rgba(12,12,12,0.62)' : 'rgba(255,255,255,0.16)' }}
      >
        {glifo}
        {soloIconoEnMovil ? <span className="hidden sm:inline">{etiqueta}</span> : etiqueta}
      </button>
    );
  }

  if (variante === 'suave') {
    return (
      <button
        type="button"
        onClick={onAgregar}
        disabled={bloqueado}
        aria-label={aria}
        className={`${base} px-3 py-1.5 rounded-full text-[12px] font-bold disabled:opacity-50 ${className}`}
        style={
          agotado
            ? { backgroundColor: estilos.dangerSoft, color: estilos.danger }
            : { backgroundColor: estilos.accentSoft, color: estilos.accentText }
        }
      >
        {glifo}
        {soloIconoEnMovil ? <span className="hidden sm:inline">{etiqueta}</span> : etiqueta}
      </button>
    );
  }

  // solido
  return (
    <button
      type="button"
      onClick={onAgregar}
      disabled={bloqueado}
      aria-label={aria}
      className={`${base} px-4 py-2.5 rounded-full text-[13px] font-bold disabled:opacity-40 ${className}`}
      style={{ backgroundColor: estilos.primary, color: estilos.onPrimary }}
    >
      {glifo}
      {soloIconoEnMovil ? <span className="hidden sm:inline">{etiqueta}</span> : etiqueta}
    </button>
  );
};
