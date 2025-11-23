
import React from 'react';
import { Platillo, Categoria } from '../../../tipos/modelos';
import { ImagenInteligente } from '../../ui';
import { Plus, Info, ArrowRight } from 'lucide-react';

interface Props {
    categorias: Categoria[];
    platillosPorCategoria: { [key: string]: Platillo[] };
    estilos: any;
    onVerPlatillo: (platillo: Platillo) => void;
    onAgregarCarrito: (platillo: Platillo) => void;
}

export const EstiloMinimalista: React.FC<Props> = ({
    categorias,
    platillosPorCategoria,
    estilos,
    onVerPlatillo,
    onAgregarCarrito
}) => {
    return (
        <div className="space-y-32 pb-32 animate-fadeIn">
            {categorias.map((categoria) => {
                const platillos = platillosPorCategoria[categoria.id] || [];
                if (platillos.length === 0) return null;

                return (
                    <section key={categoria.id} className="scroll-mt-32" id={`cat-${categoria.id}`}>
                        <div className="mb-16 md:mb-24 text-center relative px-4">
                            <span className="block text-xs font-bold tracking-[0.3em] uppercase mb-4 opacity-60" style={{ color: estilos.primary }}>
                                Categoría
                            </span>
                            <h2 className="text-5xl md:text-7xl font-thin tracking-tight mb-6" style={{ color: estilos.title }}>
                                {categoria.nombre}
                            </h2>
                            <div className="w-24 h-[1px] mx-auto" style={{ backgroundColor: estilos.text, opacity: 0.1 }}></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-24 max-w-6xl mx-auto px-6">
                            {platillos.map((platillo) => (
                                <div
                                    key={platillo.id}
                                    className="group cursor-pointer flex flex-col gap-6"
                                    onClick={() => onVerPlatillo(platillo)}
                                >
                                    {/* Imagen Grande y Limpia con Efecto Hover Sutil */}
                                    <div className="aspect-[4/3] w-full overflow-hidden relative bg-gray-50 dark:bg-white/5 transition-all duration-700 ease-out group-hover:shadow-2xl"
                                        style={{ boxShadow: estilos.isDark ? 'none' : '0 20px 40px -10px rgba(0,0,0,0.1)' }}>
                                        <ImagenInteligente
                                            src={platillo.imagen_url || ''}
                                            alt={platillo.nombre}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale-[30%] group-hover:grayscale-0"
                                        />
                                        {platillo.destacado && (
                                            <div className="absolute top-0 left-0 bg-white dark:bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm" style={{ color: estilos.primary }}>
                                                Destacado
                                            </div>
                                        )}

                                        {/* Overlay Hover Minimalista */}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-white dark:bg-black flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl">
                                                <Plus size={24} style={{ color: estilos.primary }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Minimalista */}
                                    <div className="flex flex-col gap-3 px-2">
                                        <div className="flex justify-between items-baseline gap-8 border-b pb-4 border-dashed" style={{ borderColor: estilos.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                            <h3 className="text-2xl md:text-3xl font-light leading-tight group-hover:text-primary transition-colors duration-300" style={{ color: estilos.title }}>
                                                {platillo.nombre}
                                            </h3>
                                            <span className="text-xl md:text-2xl font-light whitespace-nowrap" style={{ color: estilos.text }}>
                                                ${platillo.precio.toLocaleString()}
                                            </span>
                                        </div>

                                        <p className="text-sm md:text-base opacity-60 font-light leading-relaxed line-clamp-2 mt-2">
                                            {platillo.descripcion}
                                        </p>

                                        <div className="pt-4 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onAgregarCarrito(platillo); }}
                                                className="text-xs font-bold uppercase tracking-[0.15em] hover:underline flex items-center gap-2 group/btn"
                                                style={{ color: estilos.primary }}
                                            >
                                                Agregar al pedido <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-1" />
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
