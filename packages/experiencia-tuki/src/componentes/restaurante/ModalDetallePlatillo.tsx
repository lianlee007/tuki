import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Plus, ShoppingCart, Clock, Info, Lock, Star } from 'lucide-react';
import { Platillo } from '../../tipos';
import { ImagenInteligente } from '../ui';
import { variablesAf } from '../../lib/color';
import type { EstilosComunes } from './PlantillaRestaurante';

interface Props {
  platillo: Platillo;
  onClose: () => void;
  onAddToCart: (platillo: Platillo, cantidad: number) => void;
  estilos: EstilosComunes;
  isDark: boolean;
  localAbierto?: boolean;
}

/**
 * Detalle del platillo.
 *
 * Reparto de altura pensado para que nada se corte: la tarjeta se limita a 90vh
 * y la columna de información es la única que hace scroll (`flex-1 min-h-0`),
 * tanto apilada en móvil como en dos columnas. El botón de cerrar vive fuera de
 * esa zona de scroll, así que siempre está a la vista.
 */
export const ModalDetallePlatillo: React.FC<Props> = ({
  platillo, onClose, onAddToCart, estilos, isDark, localAbierto = true,
}) => {
  const [cantidad, setCantidad] = useState(1);
  const [animando, setAnimando] = useState(false);

  const p = estilos;

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = anterior; };
  }, []);

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [onClose]);

  const handleAdd = () => {
    if (!localAbierto) return;
    setAnimando(true);
    onAddToCart(platillo, cantidad);
    setTimeout(() => {
      setAnimando(false);
      onClose();
    }, 500);
  };

  const fondoBoton = !localAbierto ? p.surface : animando ? p.success : p.primary;
  const textoBoton = !localAbierto ? p.muted : animando ? p.onSuccess : p.onPrimary;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={platillo.nombre}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 md:p-8"
      style={{
        ...(variablesAf({ bg: estilos.bg, text: estilos.text, title: estilos.title, primary: estilos.primary, secondary: estilos.secondary }) as React.CSSProperties),
        fontFamily: `'${estilos.fuenteCuerpo}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm af-entrada-velo" onClick={onClose} />

      <div
        className="relative w-full max-w-4xl rounded-[28px] sm:rounded-[32px] overflow-hidden flex flex-col md:flex-row max-h-[90vh] af-entrada-modal"
        style={{
          backgroundColor: p.bg,
          color: p.text,
          boxShadow: isDark
            ? '0 0 0 1px rgba(255,255,255,0.08), 0 40px 80px -20px rgba(0,0,0,0.6)'
            : '0 0 0 1px rgba(0,0,0,0.05), 0 25px 50px -12px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full flex items-center justify-center border border-af/25 text-af-ink bg-af-surface/85 backdrop-blur-md af-pulsar"
        >
          <X size={18} />
        </button>

        {/* Columna imagen */}
        <div className="w-full md:w-2/5 lg:w-1/2 h-60 sm:h-72 md:h-auto relative shrink-0" style={{ backgroundColor: p.surface }}>
          {platillo.imagen_url ? (
            <ImagenInteligente src={platillo.imagen_url} alt={platillo.nombre} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: p.muted, opacity: 0.5 }}>
              <ShoppingCart size={40} />
            </div>
          )}
          {platillo.destacado && (
            <span
              className="absolute bottom-3.5 left-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
              style={{ backgroundColor: p.secondary, color: p.onSecondary }}
            >
              <Star size={12} fill="currentColor" /> Recomendado
            </span>
          )}
        </div>

        {/* Columna información: única con scroll */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-y-auto p-6 sm:p-8 md:p-10">
          <div className="space-y-6">
            <div>
              {platillo.categoria && (
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: p.accentText }}>
                  {platillo.categoria}
                </p>
              )}
              <h2 className="text-3xl sm:text-4xl font-bold font-title leading-[1.05] tracking-[-0.02em]" style={{ color: p.title }}>
                {platillo.nombre}
              </h2>
            </div>

            <div className="flex items-center gap-5 flex-wrap">
              <span className="text-3xl sm:text-4xl font-bold tabular-nums" style={{ color: p.precio }}>
                ${platillo.precio.toLocaleString()}
              </span>
              {platillo.tiempo_preparacion && (
                <span className="flex items-center gap-2 text-sm font-medium text-af-ink-secondary bg-af-surface px-3 py-1.5 rounded-full">
                  <Clock size={14} /> {platillo.tiempo_preparacion} min
                </span>
              )}
            </div>

            {platillo.descripcion && (
              <p className="text-base leading-relaxed" style={{ color: p.muted }}>
                {platillo.descripcion}
              </p>
            )}

            {platillo.ingredientes && platillo.ingredientes.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] flex items-center gap-2" style={{ color: p.muted }}>
                  <Info size={14} /> Ingredientes principales
                </h4>
                <div className="flex flex-wrap gap-2">
                  {platillo.ingredientes.map((ing, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-af-surface" style={{ color: p.text }}>
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="mt-auto pt-8">
            <div className="border-t pt-8 flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4" style={{ borderColor: p.border }}>
              <div
                className={`flex items-center justify-between gap-2 p-1.5 rounded-2xl border ${!localAbierto ? 'opacity-50 pointer-events-none' : ''}`}
                style={{ borderColor: p.border, backgroundColor: p.surface }}
              >
                <button
                  type="button"
                  aria-label="Quitar una unidad"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  className="w-10 h-10 rounded-xl flex items-center justify-center af-pulsar"
                  style={{ color: p.text }}
                >
                  <Minus size={18} />
                </button>
                <span className="text-lg font-bold w-8 text-center tabular-nums">{cantidad}</span>
                <button
                  type="button"
                  aria-label="Añadir una unidad"
                  onClick={() => setCantidad(cantidad + 1)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center af-pulsar"
                  style={{ color: p.text }}
                >
                  <Plus size={18} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={!localAbierto}
                className="flex-1 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 af-pulsar disabled:cursor-not-allowed"
                style={{ backgroundColor: fondoBoton, color: textoBoton }}
              >
                {!localAbierto ? (
                  <><Lock size={19} /> Cerrado</>
                ) : animando ? (
                  '¡Añadido!'
                ) : (
                  <><ShoppingCart size={19} /> Añadir ${(platillo.precio * cantidad).toLocaleString()}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
