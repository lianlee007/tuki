import React from 'react';
import { Platillo, Categoria } from '../../../tipos/modelos';
import { ImagenInteligente } from '../../ui';
import { ShoppingCart, ArrowUpRight } from 'lucide-react';

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
        <div className="space-y-20 pb-20">
            {categorias.map((categoria) => {
                const platillos = platillosPorCategoria[categoria.id] || [];
                if (platillos.length === 0) return null;

                return (
                    <section key={categoria.id} id={`cat-${categoria.id}`} className="scroll-mt-24 px-4 md:px-8">
                        <div className="mb-8 flex items-end gap-4 border-b pb-4" style={{ borderColor: estilos.border }}>
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter" style={{ color: estilos.title }}>
                                {categoria.nombre}
                            </h2>
                            <span className="text-sm font-bold mb-1 opacity-60">({platillos.length})</span>
                        </div>

                        {/* Masonry-like Grid using CSS Columns */}
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                            {platillos.map((platillo) => (
                                <div
                                    key={platillo.id}
                                    className="break-inside-avoid group relative cursor-pointer transition-all duration-500 hover:-translate-y-2"
                                    onClick={() => onVerPlatillo(platillo)}
                                >
                                    {/* Card Container */}
                                    <div
                                        className="overflow-hidden rounded-2xl relative"
                                        style={{
                                            backgroundColor: estilos.bg,
                                            border: estilos.isDark ? 'none' : `2px solid ${estilos.border}`,
                                            boxShadow: estilos.isDark
                                                ? '0 15px 35px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.2)' // Floating dark
                                                : '10px 10px 0px rgba(0,0,0,0.1)' // Offset shadow light
                                        }}
                                    >
                                        {/* Imagen */}
                                        <div className="relative aspect-[4/3] overflow-hidden">
                                            <ImagenInteligente
                                                src={platillo.imagen_url || ''}
                                                alt={platillo.nombre}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                            {/* Precio Flotante */}
                                            <div className="absolute top-4 right-4 bg-white text-black font-black px-3 py-1.5 rounded-lg shadow-xl transform rotate-3 group-hover:rotate-0 transition-transform">
                                                ${platillo.precio.toLocaleString()}
                                            </div>
                                        </div>

                                        {/* Contenido */}
                                        <div className="p-6 relative">
                                            <div className="flex justify-between items-start gap-4 mb-3">
                                                <h3 className="text-xl font-bold leading-tight" style={{ color: estilos.title }}>
                                                    {platillo.nombre}
                                                </h3>
                                                <ArrowUpRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: estilos.primary }} />
                                            </div>

                                            <p className="text-sm opacity-70 mb-6 line-clamp-3 leading-relaxed">
                                                {platillo.descripcion}
                                            </p>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); onAgregarCarrito(platillo); }}
                                                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                                                style={{
                                                    backgroundColor: estilos.isDark ? 'rgba(255,255,255,0.05)' : estilos.primary,
                                                    color: estilos.isDark ? 'white' : 'white'
                                                }}
                                            >
                                                <ShoppingCart size={16} /> Agregar
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
