
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Plus, ShoppingCart, Clock, Info, Lock, Star } from 'lucide-react';
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fadeIn" onClick={onClose} />

            <div
                className="relative w-full max-w-5xl bg-bg rounded-t-[2rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row max-h-[95vh] sm:max-h-[90vh] md:h-auto animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-500 shadow-2xl"
                style={{
                    backgroundColor: estilos.bg,
                    color: estilos.text,
                    boxShadow: isDark
                        ? '0 0 0 1px rgba(255,255,255,0.1), 0 40px 80px -20px rgba(0,0,0,0.8)'
                        : '0 0 0 1px rgba(0,0,0,0.05), 0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    backgroundImage: isDark ? 'none' : estilos.backgroundImage
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md transition-all hover:rotate-90 duration-300"
                >
                    <X size={24} />
                </button>

                {/* COLUMNA IMAGEN */}
                <div className="w-full md:w-1/2 h-64 sm:h-80 md:h-auto relative shrink-0 group">
                    <ImagenInteligente
                        src={platillo.imagen_url || ''}
                        alt={platillo.nombre}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 md:opacity-40"></div>

                    {platillo.destacado && (
                        <div className="absolute top-4 left-4 bg-yellow-400 text-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 border-2 border-black transform -rotate-2 group-hover:rotate-0 transition-transform">
                            <Star size={12} fill="black" /> Recomendado
                        </div>
                    )}
                </div>

                {/* COLUMNA INFO */}
                <div className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col overflow-y-auto max-h-[calc(95vh-16rem)] sm:max-h-[calc(90vh-20rem)] md:max-h-none relative">
                    {/* Decoración de fondo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" style={{ backgroundColor: `${estilos.primary}10` }}></div>

                    <div className="mb-auto space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2 opacity-60 text-xs font-bold uppercase tracking-[0.2em]">
                                <span style={{ color: estilos.primary }}>{platillo.categoria}</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-title leading-none tracking-tight mb-2" style={{ color: estilos.title }}>
                                {platillo.nombre}
                            </h2>
                            <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: estilos.primary }}></div>
                        </div>

                        <div className="flex items-center gap-6">
                            <span className="text-3xl sm:text-4xl font-bold font-serif italic" style={{ color: estilos.text }}>
                                ${platillo.precio.toLocaleString()}
                            </span>
                            {platillo.tiempo_preparacion && (
                                <span className="flex items-center gap-2 text-sm font-medium opacity-60 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">
                                    <Clock size={14} /> {platillo.tiempo_preparacion} min
                                </span>
                            )}
                        </div>

                        <p className="text-base sm:text-lg opacity-80 leading-relaxed font-light">
                            {platillo.descripcion}
                        </p>

                        {platillo.ingredientes && platillo.ingredientes.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase opacity-50 flex items-center gap-2 tracking-wider">
                                    <Info size={14} /> Ingredientes principales
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {platillo.ingredientes.map((ing, i) => (
                                        <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                            {ing}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CONTROLES FOOTER */}
                    <div className="pt-8 mt-8 border-t border-dashed" style={{ borderColor: estilos.border }}>
                        <div className="flex flex-col sm:flex-row items-stretch gap-4">
                            {/* Selector Cantidad */}
                            <div className={`flex items-center justify-between sm:justify-start gap-4 p-2 rounded-2xl border transition-opacity ${!localAbierto ? 'opacity-50 pointer-events-none' : ''}`}
                                style={{
                                    borderColor: estilos.border,
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                                }}>
                                <button
                                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                    className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all"
                                >
                                    <Minus size={20} />
                                </button>
                                <span className="text-2xl font-bold w-12 text-center font-mono">{cantidad}</span>
                                <button
                                    onClick={() => setCantidad(cantidad + 1)}
                                    className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            {/* Botón Agregar */}
                            <button
                                onClick={handleAdd}
                                disabled={!localAbierto}
                                className={`flex-1 py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-95 overflow-hidden relative text-lg uppercase tracking-wide
                            ${!localAbierto ? 'grayscale cursor-not-allowed' : ''}
                            ${animating ? 'bg-green-500' : ''}`}
                                style={{
                                    backgroundColor: !localAbierto ? '#9ca3af' : (animating ? '#22c55e' : estilos.primary),
                                    boxShadow: !localAbierto ? 'none' : `0 10px 20px -5px ${estilos.primary}60`
                                }}
                            >
                                {!localAbierto ? (
                                    <>
                                        <Lock size={20} />
                                        <span>Cerrado</span>
                                    </>
                                ) : animating ? (
                                    <span className="flex items-center gap-2 animate-in zoom-in">¡Agregado!</span>
                                ) : (
                                    <>
                                        <ShoppingCart size={20} />
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
