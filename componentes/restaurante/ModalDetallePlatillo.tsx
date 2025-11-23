
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Plus, ShoppingCart, Clock, Info, Lock } from 'lucide-react';
import { Platillo } from '../../tipos';
import { ImagenInteligente } from '../ui';

interface Props {
    platillo: Platillo;
    onClose: () => void;
    onAddToCart: (platillo: Platillo, cantidad: number) => void;
    estilos: any;
    isDark: boolean;
    localAbierto?: boolean;
}

export const ModalDetallePlatillo: React.FC<Props> = ({
    platillo, onClose, onAddToCart, estilos, isDark, localAbierto = true
}) => {
    const [cantidad, setCantidad] = useState(1);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const handleAdd = () => {
        if (!localAbierto) return;
        setAnimating(true);
        onAddToCart(platillo, cantidad);
        setTimeout(() => {
            setAnimating(false);
            onClose();
        }, 500);
    };

    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

            <div
                className="relative w-full max-w-4xl bg-bg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] sm:max-h-[90vh] md:h-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
                style={{
                    backgroundColor: estilos.bg,
                    color: estilos.text,
                    boxShadow: isDark
                        ? '0 25px 50px -12px rgba(0,0,0,0.9)'
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: isDark ? 'none' : `1px solid ${estilos.border}`,
                    backgroundImage: isDark ? 'none' : estilos.backgroundImage
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 sm:p-2.5 rounded-full bg-black/30 sm:bg-black/20 text-white hover:bg-black/50 backdrop-blur-md transition-colors"
                >
                    <X size={20} className="sm:w-6 sm:h-6" />
                </button>

                {/* COLUMNA IMAGEN */}
                <div className="w-full md:w-1/2 h-56 sm:h-64 md:h-auto relative shrink-0">
                    <ImagenInteligente
                        src={platillo.imagen_url || ''}
                        alt={platillo.nombre}
                        className="w-full h-full object-cover"
                    />
                    {/* Borde decorativo en modo claro */}
                    {!isDark && <div className="absolute inset-0 border-b-4 border-black/5 pointer-events-none"></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent md:hidden"></div>
                    {platillo.destacado && (
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-yellow-400 text-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold shadow-lg flex items-center gap-1">
                            ★ Recomendado
                        </div>
                    )}
                </div>

                {/* COLUMNA INFO */}
                <div className="flex-1 p-4 sm:p-6 md:p-10 flex flex-col overflow-y-auto max-h-[calc(95vh-14rem)] sm:max-h-[calc(90vh-16rem)] md:max-h-none">
                    <div className="mb-auto space-y-4 sm:space-y-6">
                        {/* Categoría y Nombre - Mejor organizados en móvil */}
                        <div>
                            <div className="flex items-center gap-2 mb-1.5 sm:mb-2 opacity-60 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                                <span>{platillo.categoria}</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-title leading-tight" style={{ color: estilos.title }}>
                                {platillo.nombre}
                            </h2>
                        </div>

                        {/* Precio y Tiempo - Mejor layout en móvil */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-3 sm:pb-0 border-b sm:border-none" style={{ borderColor: estilos.border }}>
                            <span className="text-xl sm:text-2xl font-bold font-serif" style={{ color: estilos.primary }}>
                                ${platillo.precio.toLocaleString()}
                            </span>
                            {platillo.tiempo_preparacion && (
                                <span className="flex items-center gap-1.5 text-[11px] sm:text-xs opacity-60">
                                    <Clock size={13} className="sm:w-3.5 sm:h-3.5" /> {platillo.tiempo_preparacion} min
                                </span>
                            )}
                        </div>

                        {/* Descripción */}
                        <p className="text-sm sm:text-base md:text-lg opacity-80 leading-relaxed font-light">
                            {platillo.descripcion}
                        </p>

                        {/* Ingredientes - Mejor responsive */}
                        {platillo.ingredientes && platillo.ingredientes.length > 0 && (
                            <div className="p-3 sm:p-4 rounded-xl border border-white/5"
                                style={{
                                    backgroundColor: isDark ? estilos.bg : 'rgba(0,0,0,0.05)',
                                    boxShadow: isDark ? 'inset 2px 2px 5px rgba(0,0,0,0.5), inset -2px -2px 5px rgba(255,255,255,0.05)' : 'none'
                                }}>
                                <h4 className="text-[10px] sm:text-xs font-bold uppercase opacity-50 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                                    <Info size={12} className="sm:w-3.5 sm:h-3.5" /> Ingredientes
                                </h4>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {platillo.ingredientes.map((ing, i) => (
                                        <span key={i} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-sm bg-bg border border-white/10 shadow-sm">
                                            {ing}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CONTROLES FOOTER - Mejor organizados para móvil */}
                    <div className="pt-4 sm:pt-6 border-t border-dashed mt-4 sm:mt-6" style={{ borderColor: estilos.border }}>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                            {/* Selector Cantidad - Mejor tamaño en móvil */}
                            <div className={`flex items-center justify-center sm:justify-start gap-3 sm:gap-4 rounded-xl p-2 sm:p-1.5 transition-opacity ${!localAbierto ? 'opacity-50 pointer-events-none' : ''}`}
                                style={{
                                    backgroundColor: isDark ? estilos.bg : 'rgba(0,0,0,0.05)',
                                    boxShadow: isDark ? 'inset 3px 3px 6px rgba(0,0,0,0.5), inset -3px -3px 6px rgba(255,255,255,0.05)' : 'none'
                                }}>
                                <button
                                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all"
                                >
                                    <Minus size={18} className="sm:w-5 sm:h-5" />
                                </button>
                                <span className="text-xl sm:text-2xl font-bold w-8 sm:w-10 text-center">{cantidad}</span>
                                <button
                                    onClick={() => setCantidad(cantidad + 1)}
                                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all"
                                >
                                    <Plus size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            {/* Botón Agregar - Full width en móvil */}
                            <button
                                onClick={handleAdd}
                                disabled={!localAbierto}
                                className={`w-full sm:flex-1 py-3.5 sm:py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 overflow-hidden relative text-sm sm:text-base
                            ${!localAbierto ? 'grayscale cursor-not-allowed' : ''}
                            ${animating ? 'bg-green-500' : ''}`}
                                style={{ backgroundColor: !localAbierto ? '#9ca3af' : (animating ? '#22c55e' : estilos.primary) }}
                            >
                                {!localAbierto ? (
                                    <>
                                        <Lock size={18} className="sm:w-5 sm:h-5" />
                                        <span>Cerrado</span>
                                    </>
                                ) : animating ? (
                                    <span className="flex items-center gap-2 animate-in zoom-in">¡Agregado!</span>
                                ) : (
                                    <>
                                        <ShoppingCart size={18} className="sm:w-5 sm:h-5" />
                                        <span>Agregar ${(platillo.precio * cantidad).toLocaleString()}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
