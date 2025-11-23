
import React from 'react';
import { EstilosComunes } from '../PlantillaRestaurante';
import { Platillo } from '../../../tipos';
import { Plus, Star, ShoppingCart, Lock } from 'lucide-react';
import { ImagenInteligente } from '../../ui';

interface Props {
  categorias: string[];
  menuPorCategoria: Record<string, Platillo[]>;
  onVerPlatillo: (p: Platillo) => void;
  onAgregarAlCarrito: (p: Platillo, e?: React.MouseEvent) => void;
  estilos: EstilosComunes;
  refs: any;
  localAbierto: boolean;
}

export const EstiloModerno: React.FC<Props> = ({ categorias, menuPorCategoria, onVerPlatillo, onAgregarAlCarrito, estilos, refs, localAbierto }) => {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12 animate-fadeIn">
      {categorias.map(categoria => (
        <div key={categoria} ref={(el) => { refs.current[categoria] = el; }} className="mb-10 sm:mb-12 md:mb-16 scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32">
          {/* Header de Categoría Sticky */}
          <div className="sticky top-16 sm:top-20 z-30 py-3 sm:py-4 mb-6 sm:mb-8 backdrop-blur-xl bg-opacity-90 transition-all duration-300 rounded-xl sm:rounded-2xl px-4 sm:px-5 shadow-sm border border-white/10"
            style={{
              backgroundColor: estilos.isDark ? 'rgba(26, 29, 33, 0.85)' : 'rgba(255, 255, 255, 0.85)',
              borderLeft: `4px solid ${estilos.primary}`
            }}>
            <div className="flex items-center gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-title tracking-tight flex-1 min-w-0" style={{ color: estilos.title }}>{categoria}</h2>
              <span className="text-[10px] sm:text-xs font-bold text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: estilos.primary }}>{menuPorCategoria[categoria].length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
            {menuPorCategoria[categoria].map(platillo => (
              <div
                key={platillo.id}
                className="group relative flex flex-col rounded-2xl sm:rounded-[2rem] overflow-hidden transition-all duration-500 cursor-pointer"
                onClick={() => onVerPlatillo(platillo)}
                style={{
                  backgroundColor: estilos.cardBg,
                  boxShadow: estilos.cardShadow,
                  border: estilos.cardBorder,
                  // Bordes adicionales para modo oscuro (profundidad)
                  borderTop: estilos.isDark ? `1px solid ${estilos.borderHighlight}` : undefined,
                  borderLeft: estilos.isDark ? `1px solid ${estilos.borderHighlight}` : undefined,
                  borderBottom: estilos.isDark ? `1px solid ${estilos.borderShadow}` : undefined,
                  borderRight: estilos.isDark ? `1px solid ${estilos.borderShadow}` : undefined,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = estilos.cardHoverShadow;
                  e.currentTarget.style.transform = 'translateY(-8px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = estilos.cardShadow;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Imagen y Badge de Precio */}
                <div className="relative h-52 sm:h-60 md:h-64 overflow-hidden">
                  <ImagenInteligente
                    src={platillo.imagen_url || ''}
                    alt={platillo.nombre}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80"></div>

                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black text-white shadow-lg backdrop-blur-md flex items-center gap-1 border border-white/20"
                      style={{ backgroundColor: estilos.primary }}>
                      ${platillo.precio.toLocaleString()}
                    </span>
                  </div>
                  {platillo.destacado && (
                    <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
                      <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-lg animate-pulse border-2 border-white">
                        <Star size={16} className="sm:w-5 sm:h-5" fill="currentColor" />
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-5 sm:p-6 md:p-7 flex-1 flex flex-col relative">
                  {/* Botones Flotantes superpuestos */}
                  <div className="absolute -top-6 sm:-top-7 right-5 sm:right-6 flex gap-3 z-20">
                    {/* Botón Agregar al Carrito */}
                    <button
                      onClick={(e) => onAgregarAlCarrito(platillo, e)}
                      disabled={!localAbierto}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-xl transform transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white dark:border-gray-800 ${!localAbierto ? 'opacity-50 cursor-not-allowed grayscale' : ''
                        }`}
                      style={{ backgroundColor: localAbierto ? estilos.primary : '#9ca3af', color: '#fff' }}
                      title={localAbierto ? 'Agregar al carrito' : 'Restaurante cerrado'}
                    >
                      {localAbierto ? (
                        <ShoppingCart size={20} className="sm:w-5 sm:h-5" />
                      ) : (
                        <Lock size={20} className="sm:w-5 sm:h-5" />
                      )}
                    </button>
                    {/* Botón Ver Detalles */}
                    <div
                      onClick={(e) => { e.stopPropagation(); onVerPlatillo(platillo); }}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-xl transform transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer border-2 border-white dark:border-gray-800"
                      style={{ backgroundColor: estilos.secondary || estilos.primary, color: '#fff' }}
                      title="Ver detalles"
                    >
                      <Plus size={22} className="sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold font-title leading-tight mb-2 pr-4 mt-2" style={{ color: estilos.title }}>
                    {platillo.nombre}
                  </h3>
                  <p className="text-sm opacity-70 mb-4 line-clamp-2 leading-relaxed font-medium">
                    {platillo.descripcion}
                  </p>

                  {platillo.ingredientes && platillo.ingredientes.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t border-dashed" style={{ borderColor: estilos.border }}>
                      {platillo.ingredientes.slice(0, 3).map((ing, i) => (
                        <span key={i} className="text-[10px] uppercase font-bold px-2 py-1 rounded-md bg-black/5 dark:bg-white/5 opacity-70 tracking-wide">
                          {ing}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
