import React from 'react';
import type { PlantillaMenuProps } from './tipos';
import { AbrirPlatillo, BotonAgregar, ChipAgotado, ChipDestacado, FotoPlatillo } from './piezas';
import { EtiquetasPlatillo } from '../EtiquetasPlatillo';

/**
 * Vitrina: el menú se recorre en horizontal. Una estantería por categoría, con
 * desplazamiento por ajuste (snap) y la siguiente tarjeta asomando como pista
 * de que hay más. Es la única estructura de navegación lateral del conjunto y
 * va bien cuando las fotos son el argumento de venta.
 *
 * El carril es un `role="region"` enfocable: se recorre con el teclado (flechas)
 * y el foco se dibuja por dentro, sin depender del ratón.
 */
export const EstiloVitrina: React.FC<PlantillaMenuProps> = ({
  categorias,
  menuPorCategoria,
  estilos,
  refs,
  onVerPlatillo,
  onAgregarAlCarrito,
  localAbierto,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
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
            <div className="flex items-end justify-between gap-4 mb-5 sm:mb-6">
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold font-title tracking-[-0.025em] min-w-0"
                style={{ color: estilos.title }}
              >
                {categoria}
              </h2>
              <span className="text-xs font-semibold tabular-nums shrink-0 pb-1.5" style={{ color: estilos.muted }}>
                {platillos.length} {platillos.length === 1 ? 'plato' : 'platos'}
              </span>
            </div>

            <div
              role="region"
              aria-label={`${categoria}: desplázate en horizontal para ver todos los platos`}
              tabIndex={0}
              className="af-sin-scrollbar -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-6 lg:scroll-pl-8 pb-2 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-af-accent-text"
            >
              {platillos.map((p) => (
                <article
                  key={p.id}
                  className="card-af-resto af-zoom relative flex flex-col overflow-hidden snap-start shrink-0 grow basis-[78vw] sm:basis-[300px] lg:basis-[336px] max-w-[680px]"
                >
                  <AbrirPlatillo platillo={p} onVer={onVerPlatillo} radio="rounded-[20px]" />

                  <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
                    <FotoPlatillo platillo={p} estilos={estilos} clase="w-full h-full" icono={30} />
                    {p.destacado && p.disponible && <ChipDestacado estilos={estilos} className="absolute top-3 left-3" />}
                    {!p.disponible && (
                      <div
                        className="pointer-events-none absolute inset-0 flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                      >
                        <ChipAgotado texto="Agotado hoy" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        className="font-bold text-[15px] sm:text-base leading-snug line-clamp-2 min-w-0 break-words"
                        style={{ color: estilos.title }}
                      >
                        {p.nombre}
                      </h3>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 font-bold text-[15px] sm:text-base tabular-nums"
                        style={{ backgroundColor: estilos.accentSoft, color: estilos.precio }}
                      >
                        ${p.precio.toLocaleString()}
                      </span>
                    </div>

                    {p.descripcion && (
                      <p className="text-[13px] sm:text-sm mt-1.5 line-clamp-2 leading-relaxed break-words" style={{ color: estilos.muted }}>
                        {p.descripcion}
                      </p>
                    )}

                    <div className="relative z-20 mt-auto pt-4 flex items-end justify-between gap-2">
                      <EtiquetasPlatillo platillo={p} compacto className="pointer-events-none" />
                      <BotonAgregar
                        platillo={p}
                        estilos={estilos}
                        localAbierto={localAbierto}
                        soloIconoEnMovil
                        onAgregar={(e) => onAgregarAlCarrito(p, e)}
                        className="ml-auto"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
