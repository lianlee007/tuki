
import React from 'react';
import { EstilosComunes } from '../PlantillaRestaurante';
import { Platillo } from '../../../tipos';
import { Plus, ArrowRight } from 'lucide-react';
import { ImagenInteligente } from '../../ui';

interface Props {
    categorias: string[];
    menuPorCategoria: Record<string, Platillo[]>;
    onVerPlatillo: (p: Platillo) => void;
    onAgregarAlCarrito?: (p: Platillo, e?: React.MouseEvent) => void;
    estilos: EstilosComunes;
    refs: any;
    localAbierto?: boolean;
}

export const EstiloInmersivo: React.FC<Props> = ({ categorias, menuPorCategoria, onVerPlatillo, onAgregarAlCarrito, estilos, refs, localAbierto = true }) => {
    // Aplanar todos los platillos para el grid continuo
    const todosLosPlatillos = categorias.flatMap(cat => menuPorCategoria[cat].map(p => ({ ...p, categoriaNombre: cat })));

    return (
        <div className="w-full min-h-screen animate-fadeIn pb-20">
            {/* LAYOUT UNIFICADO: Grid Editorial Responsivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-2 sm:p-4">
                {todosLosPlatillos.map((platillo, idx) => {
                    // Patrón visual: Cada 5 elementos, el primero es grande (2x2) en escritorio
                    const isLarge = idx % 5 === 0;

                    // Clases dinámicas según el tamaño
                    const gridClasses = isLarge
                        ? 'col-span-1 sm:col-span-2 row-span-1 sm:row-span-2 aspect-[4/5] sm:aspect-square'
                        : 'col-span-1 aspect-[4/5]';

                    return (
                        <div
                            key={platillo.id}
                            onClick={() => onVerPlatillo(platillo)}
                            className={`relative group overflow-hidden cursor-pointer rounded-2xl ${gridClasses}`}
                            style={{
                                backgroundColor: estilos.bg,
                                boxShadow: estilos.isDark ? '0 10px 30px -10px rgba(0,0,0,0.5)' : '0 10px 30px -10px rgba(0,0,0,0.1)'
                            }}
                        >
                            {/* Imagen de Fondo */}
                            <div className="absolute inset-0 transition-transform duration-1000 group-hover:scale-110">
                                <ImagenInteligente src={platillo.imagen_url || ''} alt={platillo.nombre} className="w-full h-full object-cover" />
                            </div>

                            {/* Overlays */}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>

                            {/* Contenido */}
                            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                                <span className="inline-block text-[10px] font-black text-white mb-2 tracking-[0.2em] uppercase bg-primary/80 px-2 py-1 rounded backdrop-blur-md"
                                    style={{ backgroundColor: estilos.primary }}>
                                    {platillo.categoriaNombre}
                                </span>

                                <h3 className={`font-black font-title text-white mb-2 leading-none uppercase tracking-tight ${isLarge ? 'text-3xl md:text-5xl' : 'text-xl md:text-3xl'}`}>
                                    {platillo.nombre}
                                </h3>

                                <p className="text-gray-200 text-xs sm:text-sm line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 font-medium">
                                    {platillo.descripcion}
                                </p>

                                <div className="flex items-center justify-between border-t border-white/20 pt-4 opacity-90 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xl sm:text-2xl font-bold text-white font-mono">
                                        ${platillo.precio.toLocaleString()}
                                    </span>

                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white group-hover:text-primary transition-colors">
                                        Ver Detalles <ArrowRight size={14} />
                                    </div>

                                    {onAgregarAlCarrito && localAbierto && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAgregarAlCarrito(platillo, e);
                                            }}
                                            className="absolute bottom-6 right-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:bg-primary hover:text-white transition-all transform scale-0 group-hover:scale-100 duration-300 delay-100"
                                            style={{ backgroundColor: estilos.primary, color: 'white' }}
                                        >
                                            <Plus size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};