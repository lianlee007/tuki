
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
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-multiply dark:mix-blend-screen"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='currentColor' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
      ></div>

      {/* Marco decorativo exterior */}
      <div className="absolute inset-2 sm:inset-4 md:inset-8 border-2 border-double pointer-events-none opacity-40 rounded-3xl"
        style={{
          borderColor: estilos.primary,
          boxShadow: estilos.isDark ? `inset 0 0 40px ${estilos.primary}20` : 'none'
        }}></div>

      <div className="relative z-10 py-4 sm:py-6 md:py-8">
        {categorias.map(categoria => (
          <div key={categoria} ref={(el) => { refs.current[categoria] = el; }} className="mb-12 sm:mb-16 md:mb-24 scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32">

            {/* Título de Categoría Ornamentado */}
            <div className="text-center mb-8 sm:mb-12 md:mb-16 relative px-2 sm:px-4">
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-3 opacity-70">
                <div className="h-[1px] w-8 sm:w-16 bg-current" style={{ backgroundColor: estilos.secondary }}></div>
                <span className="font-serif italic text-sm sm:text-base tracking-widest uppercase" style={{ color: estilos.secondary }}>Selección de</span>
                <div className="h-[1px] w-8 sm:w-16 bg-current" style={{ backgroundColor: estilos.secondary }}></div>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-title tracking-tight drop-shadow-sm" style={{ color: estilos.title }}>{categoria}</h2>
            </div>

            <div className="space-y-6 sm:space-y-8 md:space-y-10 px-1 sm:px-2 md:px-8">
              {menuPorCategoria[categoria].map(platillo => (
                <div
                  key={platillo.id}
                  className="group relative cursor-pointer p-3 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl transition-all duration-500 hover:bg-black/5 dark:hover:bg-white/5 w-full border border-transparent hover:border-current"
                  style={{ borderColor: estilos.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  onClick={() => onVerPlatillo(platillo)}
                >
                  <div className="flex gap-4 sm:gap-5 md:gap-6 lg:gap-8 items-center w-full">
                    {/* Imagen Circular con Borde Decorativo */}
                    <div
                      className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0 relative overflow-hidden rounded-full border-4 border-double p-1 bg-surface group-hover:scale-105 transition-transform duration-500 shadow-xl"
                      style={{
                        borderColor: estilos.primary,
                        backgroundColor: estilos.bg,
                        boxShadow: estilos.isDark ? `0 0 20px ${estilos.primary}30` : '0 8px 20px rgba(0,0,0,0.1)'
                      }}
                    >
                      <ImagenInteligente
                        src={platillo.imagen_url || ''}
                        alt={platillo.nombre}
                        className="w-full h-full object-cover rounded-full grayscale-[10%] group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                      {/* Header del item: Nombre y Precio */}
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 w-full mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1 relative">
                          {platillo.destacado && <ChefHat size={18} className="text-yellow-500 flex-shrink-0 mb-1 animate-bounce" />}
                          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold font-title text-text-main group-hover:text-primary transition-colors duration-300 leading-tight break-words">
                            {platillo.nombre}
                          </h3>
                          {/* Línea punteada (Leader) - Visible solo en desktop */}
                          <div className="hidden md:block flex-1 border-b-2 border-dotted mx-4 opacity-20 mb-2" style={{ borderColor: estilos.text }}></div>
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto shrink-0 mt-1 sm:mt-0 gap-3">
                          <span className="font-serif text-xl sm:text-2xl md:text-3xl font-bold italic" style={{ color: estilos.primary }}>
                            ${platillo.precio.toLocaleString()}
                          </span>

                          {/* Botón Agregar al Carrito */}
                          <button
                            onClick={(e) => onAgregarAlCarrito(platillo, e)}
                            disabled={!localAbierto}
                            className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95 ${!localAbierto ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            style={{
                              backgroundColor: localAbierto ? estilos.secondary : '#9ca3af',
                              color: '#fff'
                            }}
                            title={localAbierto ? 'Agregar al carrito' : 'Restaurante cerrado'}
                          >
                            {localAbierto ? <ShoppingCart size={18} /> : <Lock size={18} />}
                          </button>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base opacity-80 font-serif leading-relaxed line-clamp-2 break-words pr-2 sm:pr-8 italic">
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