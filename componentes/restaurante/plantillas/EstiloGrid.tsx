
import React from 'react';
import { Platillo, Categoria } from '../../../tipos/modelos';
import { ImagenInteligente } from '../../ui';
import { ShoppingCart, ArrowUpRight, Star } from 'lucide-react';

interface Props {
    categorias: Categoria[];
    platillosPorCategoria: { [key: string]: Platillo[] };
    estilos: any;
    onVerPlatillo: (platillo: Platillo) => void;
    onAgregarCarrito: (platillo: Platillo) => void;
}

export const EstiloGrid: React.FC<Props> = ({
    categorias,
    platillosPorCategoria,
    estilos,
    onVerPlatillo,
    onAgregarCarrito
}) => {
    return (
        <div className="space-y-20 pb-20 animate-fadeIn">
            {categorias.map((categoria) => {
                const platillos = platillosPorCategoria[categoria.id] || [];
                if (platillos.length === 0) return null;

                return (
                    <section key={categoria.id} id={`cat-${categoria.id}`} className="scroll-mt-24 px-4 md:px-8">
                        <div className="mb-8 flex items-end gap-4 border-b-4 pb-4" style={{ borderColor: estilos.primary }}>
                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter transform -skew-x-6" style={{ color: estilos.title }}>
                                {categoria.nombre}
                            </h2>
                            <span className="text-lg font-bold mb-2 opacity-60 font-mono">({platillos.length})</span>
                        </div>

                        {/* Masonry-like Grid using CSS Columns */}
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                            {platillos.map((platillo) => (
                                <div
                                    key={platillo.id}
                                    className="break-inside-avoid group relative cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:rotate-1"
                                    onClick={() => onVerPlatillo(platillo)}
                                >
                                    {/* Card Container */}
                                    <div
                                        className="overflow-hidden rounded-3xl relative"
                                        style={{
                                            backgroundColor: estilos.bg,
                                            border: estilos.isDark ? `1px solid ${estilos.borderHighlight}` : `3px solid ${estilos.text}`,
                                            boxShadow: estilos.isDark
                                                ? '0 20px 40px -10px rgba(0,0,0,0.6), 0 0 20px rgba(255,255,255,0.05)' // Floating dark glow
                                                : `12px 12px 0px ${estilos.text}` // Bold Offset shadow light
                                        }}
                                    >
                                        {/* Imagen */}
                                        <div className="relative aspect-[4/3] overflow-hidden border-b-2" style={{ borderColor: estilos.isDark ? 'transparent' : estilos.text }}>
                                            <ImagenInteligente
                                                src={platillo.imagen_url || ''}
                                                alt={platillo.nombre}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

                                            {/* Precio Flotante */}
                                            <div className="absolute top-4 right-4 font-black px-4 py-2 rounded-xl shadow-xl transform -rotate-2 group-hover:rotate-0 transition-transform border-2 border-black"
                                                style={{ backgroundColor: estilos.primary, color: 'white' }}>
                                                ${platillo.precio.toLocaleString()}
                                            </div>

                                            {platillo.destacado && (
                                                <div className="absolute top-4 left-4 bg-yellow-400 text-black p-2 rounded-full border-2 border-black shadow-[4px_4px_0px_black]">
                                                    <Star size={20} fill="black" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Contenido */}
                                        <div className="p-6 relative bg-surface">
                                            <div className="flex justify-between items-start gap-4 mb-3">
                                                <h3 className="text-2xl font-black leading-none uppercase transform -skew-x-3" style={{ color: estilos.title }}>
                                                    {platillo.nombre}
                                                </h3>
                                                <ArrowUpRight size={24} className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 group-hover:-translate-y-1" style={{ color: estilos.primary }} />
                                            </div>

                                            <p className="text-sm font-medium opacity-70 mb-6 line-clamp-3 leading-relaxed">
                                                {platillo.descripcion}
                                            </p>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); onAgregarCarrito(platillo); }}
                                                className="w-full py-3.5 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:brightness-110 active:translate-y-1"
                                                style={{
                                                    backgroundColor: estilos.text,
                                                    color: estilos.bg,
                                                    boxShadow: estilos.isDark ? 'none' : '4px 4px 0px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                <ShoppingCart size={18} /> Agregar al pedido
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
};
