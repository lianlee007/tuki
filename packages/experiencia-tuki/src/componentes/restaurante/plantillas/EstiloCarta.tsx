import React from 'react';
import { Star } from 'lucide-react';
import type { PlantillaMenuProps } from './tipos';
import { AbrirPlatillo, BotonAgregar, FotoPlatillo } from './piezas';
import { EtiquetasPlatillo } from '../EtiquetasPlatillo';

/**
 * Carta: la estructura impresa. Tipografía tranquila, dos columnas y la línea
 * de puntos que guía la vista del nombre al precio —el único recurso gráfico
 * aquí, y es contenido, no adorno.
 *
 * Se quitó la ceja "Menú" y la regla corta bajo el título: el título grande
 * centrado ya dice lo que hay que decir, y el aire lo separa de la lista.
 * El nombre admite dos líneas y precio y puntos se alinean con la primera, así
 * un plato de nombre largo nunca queda recortado.
 */
export const EstiloCarta: React.FC<PlantillaMenuProps> = ({
  categorias,
  menuPorCategoria,
  estilos,
  refs,
  onVerPlatillo,
  onAgregarAlCarrito,
  localAbierto,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
      {categorias.map((categoria, indiceCat) => {
        const platillos = menuPorCategoria[categoria] || [];
        if (platillos.length === 0) return null;

        return (
          <section
            key={categoria}
            id={`cat-${categoria}`}
            ref={(el) => { refs.current[categoria] = el; }}
            className={`af-ancla ${indiceCat > 0 ? 'mt-16 sm:mt-24' : ''}`}
          >
            <h2
              className="text-center text-3xl sm:text-4xl md:text-5xl font-bold font-title tracking-[-0.03em] mb-10 sm:mb-14"
              style={{ color: estilos.title }}
            >
              {categoria}
            </h2>

            <div className="lg:columns-2 lg:gap-x-14">
              {platillos.map((p) => {
                const agotado = !p.disponible;
                return (
                  <article key={p.id} className="af-zoom relative break-inside-avoid mb-7 sm:mb-8">
                    <AbrirPlatillo platillo={p} onVer={onVerPlatillo} radio="rounded-2xl" />

                    <div className="flex gap-4">
                      <div className="w-[74px] h-[74px] sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0" style={{ backgroundColor: estilos.surface }}>
                        <FotoPlatillo platillo={p} estilos={estilos} clase="w-full h-full" icono={22} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2.5">
                          <h3 className="font-title font-bold text-[17px] sm:text-lg leading-snug min-w-0 break-words" style={{ color: estilos.title }}>
                            {p.destacado && (
                              <Star size={13} className="inline-block align-[-2px] mr-1.5" style={{ color: estilos.secondaryText }} fill="currentColor" />
                            )}
                            {p.nombre}
                          </h3>
                          <span className="flex-1 border-b border-dotted translate-y-[-3px] min-w-4" style={{ borderColor: estilos.border }} />
                          <span
                            className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-bold text-[17px] sm:text-lg tabular-nums"
                            style={{ backgroundColor: estilos.precioFondo, color: estilos.precio, textDecoration: agotado ? 'line-through' : 'none' }}
                          >
                            ${p.precio.toLocaleString()}
                          </span>
                        </div>

                        {p.descripcion && (
                          <p className="text-[13px] sm:text-sm mt-1 leading-relaxed break-words" style={{ color: estilos.muted }}>
                            {p.descripcion}
                          </p>
                        )}

                        {p.ingredientes && p.ingredientes.length > 0 && (
                          <p className="text-xs mt-1 italic break-words" style={{ color: estilos.muted, opacity: 0.85 }}>
                            {p.ingredientes.join(' · ')}
                          </p>
                        )}

                        <div className="relative z-20 mt-2.5 flex items-center gap-3 flex-wrap">
                          <EtiquetasPlatillo platillo={p} compacto className="pointer-events-none" />
                          <BotonAgregar
                            platillo={p}
                            estilos={estilos}
                            localAbierto={localAbierto}
                            variante="suave"
                            onAgregar={(e) => onAgregarAlCarrito(p, e)}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
