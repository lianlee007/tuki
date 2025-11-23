import React from 'react';
import { EstilosComunes } from '../PlantillaRestaurante';
import { Platillo } from '../../../tipos';
import { ChefHat, ShoppingCart, Lock } from 'lucide-react';
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

export const EstiloCarta: React.FC<Props> = ({ categorias, menuPorCategoria, onVerPlatillo, onAgregarAlCarrito, estilos, refs, localAbierto }) => {
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16 animate-fadeIn relative w-full overflow-hidden">
      {/* Textura de papel sutil de fondo */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply dark:mix-blend-screen"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='currentColor' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
      ></div>

      {/* Marco decorativo exterior */}
      <div className="absolute inset-2 sm:inset-4 md:inset-8 border-2 border-double pointer-events-none opacity-30" style={{ borderColor: estilos.primary }}></div>

      <div className="relative z-10 py-4 sm:py-6 md:py-8">
        {categorias.map(categoria => (
          <div key={categoria} ref={(el) => { refs.current[categoria] = el; }} className="mb-12 sm:mb-16 md:mb-24 scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32">

            {/* Título de Categoría Ornamentado */}
            <div className="text-center mb-8 sm:mb-12 md:mb-16 relative px-2 sm:px-4">
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-1 sm:mb-2 opacity-60">
                <div className="h-[1px] w-8 sm:w-12 bg-current"></div>
                <span className="font-serif italic text-xs sm:text-sm" style={{ color: estilos.primary }}>Selección de</span>
                <div className="h-[1px] w-8 sm:w-12 bg-current"></div>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-title tracking-tight" style={{ color: estilos.title, textShadow: estilos.isDark ? '0 2px 4px rgba(0,0,0,0.3)' : 'none' }}>{categoria}</h2>
            </div>

            <div className="space-y-6 sm:space-y-8 md:space-y-10 px-1 sm:px-2 md:px-8">
              {menuPorCategoria[categoria].map(platillo => (
                <div
                  key={platillo.id}
                  className="group relative cursor-pointer p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl transition-all duration-500 hover:bg-black/5 dark:hover:bg-white/5 w-full"
                  onClick={() => onVerPlatillo(platillo)}
                >
                  <div className="flex gap-3 sm:gap-4 md:gap-5 lg:gap-8 items-center w-full">
                    {/* Imagen Circular con Borde Decorativo */}
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 shrink-0 relative overflow-hidden rounded-full border-2 sm:border-[3px] border-double p-0.5 sm:p-1 bg-surface group-hover:scale-105 transition-transform duration-500"
                      style={{
                        borderColor: estilos.primary,
                        boxShadow: estilos.isDark ? '0 8px 16px -1px rgba(0, 0, 0, 0.5), 0 4px 8px -1px rgba(0, 0, 0, 0.3)' : 'none'
                      }}
                    >
                      <ImagenInteligente
                        src={platillo.imagen_url || ''}
                        alt={platillo.nombre}
                        className="w-full h-full object-cover rounded-full grayscale-[20%] group-hover:grayscale-0 transition-all"
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                      {/* Header del item: Nombre y Precio */}
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 w-full mb-1 sm:mb-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 relative">
                          {platillo.destacado && <ChefHat size={16} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] text-yellow-500 flex-shrink-0 mb-0.5 sm:mb-1" />}
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-title text-text-main group-hover:text-primary transition-colors duration-300 leading-tight break-words">
                            {platillo.nombre}
                          </h3>
                          {/* Línea punteada (Leader) - Visible solo en desktop */}
                          <div className="hidden md:block flex-1 border-b-2 border-dotted mx-3 md:mx-4 opacity-30 mb-1" style={{ borderColor: estilos.text }}></div>
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto shrink-0 mt-1 sm:mt-0 gap-2 sm:gap-3">
                          <span className="font-serif text-lg sm:text-xl md:text-2xl font-bold italic" style={{ color: estilos.primary }}>
                            ${platillo.precio.toLocaleString()}
                          </span>
                          {/* Botón Agregar al Carrito */}
                          <button
                            onClick={(e) => onAgregarAlCarrito(platillo, e)}
                            disabled={!localAbierto}
                            className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5 sm:gap-2 shadow-md ${!localAbierto ? 'opacity-50 cursor-not-allowed grayscale' : ''
                              }`}
                            style={{
                              backgroundColor: localAbierto ? estilos.primary : '#9ca3af',
                              color: '#fff'
                            }}
                            title={localAbierto ? 'Agregar al carrito' : 'Restaurante cerrado'}
                          >
                            {localAbierto ? (
                              <>
                                <ShoppingCart size={14} className="sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Agregar</span>
                              </>
                            ) : (
                              <>
                                <Lock size={14} className="sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Cerrado</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm md:text-base opacity-70 font-serif leading-relaxed line-clamp-2 break-words pr-2 sm:pr-4">
                        {platillo.descripcion}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};