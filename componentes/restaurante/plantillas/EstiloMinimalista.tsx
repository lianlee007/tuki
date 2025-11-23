import React from 'react';
import { Platillo, Categoria } from '../../../tipos/modelos';
import { ImagenInteligente } from '../../ui';
import { Plus, Info } from 'lucide-react';

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
        <div className="space-y-24 pb-20">
            {categorias.map((categoria) => {
                const platillos = platillosPorCategoria[categoria.id] || [];
                if (platillos.length === 0) return null;

                return (
                    <section key={categoria.id} className="scroll-mt-24" id={`cat-${categoria.id}`}>
                        <div className="mb-12 text-center relative">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4" style={{ color: estilos.title }}>
                                {categoria.nombre}
                            </h2>
                            <div className="w-16 h-0.5 mx-auto opacity-30" style={{ backgroundColor: estilos.primary }}></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 max-w-5xl mx-auto px-4">
                            {platillos.map((platillo) => (
                                <div
                                    key={platillo.id}
                                    className="group cursor-pointer flex flex-col gap-4"
                                    onClick={() => onVerPlatillo(platillo)}
                                >
                                    {/* Imagen Grande y Limpia */}
                                    <div className="aspect-[4/3] w-full overflow-hidden rounded-sm relative bg-gray-100 dark:bg-white/5">
                                        <ImagenInteligente
                                            src={platillo.imagen_url || ''}
                                            alt={platillo.nombre}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        {platillo.destacado && (
                                            <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-sm">
                                                Destacado
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Minimalista */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-baseline gap-4">
                                            <h3 className="text-xl md:text-2xl font-medium leading-tight group-hover:opacity-70 transition-opacity" style={{ color: estilos.title }}>
                                                {platillo.nombre}
                                            </h3>
                                            <span className="text-lg font-light whitespace-nowrap" style={{ color: estilos.primary }}>
                                                ${platillo.precio.toLocaleString()}
                                            </span>
                                        </div>

                                        <p className="text-sm opacity-60 font-light leading-relaxed line-clamp-2">
                                            {platillo.descripcion}
                                        </p>

                                        <div className="pt-2 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onAgregarCarrito(platillo); }}
                                                className="text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
                                                style={{ color: estilos.primary }}
                                            >
                                                <Plus size={14} /> Agregar
                                            </button>
                                            <button
                                                className="text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1 opacity-60 hover:opacity-100"
                                                style={{ color: estilos.text }}
                                            >
                                                <Info size={14} /> Detalles
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
