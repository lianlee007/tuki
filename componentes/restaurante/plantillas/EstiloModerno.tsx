
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
          <div className="sticky top-16 sm:top-20 z-30 py-3 sm:py-4 mb-4 sm:mb-6 backdrop-blur-xl bg-opacity-90 transition-colors rounded-lg sm:rounded-xl px-2 sm:px-3" style={{ backgroundColor: `${estilos.bg}AA` }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-6 sm:h-8 w-1 sm:w-1.5 rounded-full" style={{ background: estilos.primary }}></div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-title tracking-tight flex-1 min-w-0" style={{ color: estilos.title }}>{categoria}</h2>
              <span className="text-[10px] sm:text-xs font-bold opacity-50 ml-auto px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-current shrink-0">{menuPorCategoria[categoria].length} items</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {menuPorCategoria[categoria].map(platillo => (
              <div
                key={platillo.id}
                className="group relative flex flex-col rounded-2xl sm:rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 cursor-pointer"
                onClick={() => onVerPlatillo(platillo)}
                style={{
                  backgroundColor: estilos.bg,
                  boxShadow: estilos.shadow,
                  border: estilos.isDark ? 'none' : `1px solid ${estilos.border}`,
                  borderTop: estilos.isDark ? `1px solid ${estilos.borderHighlight}` : undefined,
                  borderLeft: estilos.isDark ? `1px solid ${estilos.borderHighlight}` : undefined,
                  borderBottom: estilos.isDark ? `1px solid ${estilos.borderShadow}` : undefined,
                  borderRight: estilos.isDark ? `1px solid ${estilos.borderShadow}` : undefined,
                }}
              >
                {/* Imagen y Badge de Precio */}
                <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
                  <ImagenInteligente
                    src={platillo.imagen_url || ''}
                    alt={platillo.nombre}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black bg-white/90 text-black shadow-lg backdrop-blur-md flex items-center gap-1">
                      ${platillo.precio.toLocaleString()}
                    </span>
                  </div>
                  {platillo.destacado && (
                    <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-lg animate-pulse">
                        <Star size={14} className="sm:w-4 sm:h-4" fill="currentColor" />
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-4 sm:p-5 md:p-6 flex-1 flex flex-col relative">
                  <div className="absolute -top-4 sm:-top-5 md:-top-6 right-4 sm:right-5 md:right-6 flex gap-2">
                    {/* Botón Agregar al Carrito */}
                    <button
                      onClick={(e) => onAgregarAlCarrito(platillo, e)}
                      disabled={!localAbierto}
                      className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 active:scale-95 ${!localAbierto ? 'opacity-50 cursor-not-allowed grayscale' : ''
                        }`}
                      style={{ backgroundColor: localAbierto ? estilos.primary : '#9ca3af', color: '#fff' }}
                      title={localAbierto ? 'Agregar al carrito' : 'Restaurante cerrado'}
                    >
                      {localAbierto ? (
                        <ShoppingCart size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      ) : (
                        <Lock size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      )}
                    </button>
                    {/* Botón Ver Detalles */}
                    <div
                      onClick={() => onVerPlatillo(platillo)}
                      className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 active:scale-95 cursor-pointer"
                      style={{ backgroundColor: estilos.secondary || estilos.primary, color: '#fff', opacity: 0.8 }}
                      title="Ver detalles"
                    >
                      <Plus size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold font-title leading-tight mb-2 pr-20 sm:pr-24" style={{ color: estilos.title }}>
                    {platillo.nombre}
                  </h3>
                  <p className="text-xs sm:text-sm opacity-70 mb-3 sm:mb-4 line-clamp-2 leading-relaxed font-medium">
                    {platillo.descripcion}
                  </p>

                  {platillo.ingredientes && platillo.ingredientes.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-dashed" style={{ borderColor: estilos.border }}>
                      {platillo.ingredientes.slice(0, 3).map((ing, i) => (
                        <span key={i} className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-black/5 dark:bg-white/5 opacity-70">
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
