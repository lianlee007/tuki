import React from 'react';
import type { PlantillaMenuProps } from './tipos';
import { AbrirPlatillo, BotonAgregar, ChipAgotado, ChipDestacado, FotoPlatillo } from './piezas';
import { EtiquetasPlatillo } from '../EtiquetasPlatillo';

/**
 * Tarjetas: la estructura más versátil. Cada platillo es una tarjeta con foto,
 * nombre, descripción, ingredientes, etiquetas y precio; se pide en un toque.
 *
 * La cabecera de sección ya no lleva la regla de 1 px que "cerraba" el título:
 * el título y el recuento se alinean por su línea base y el aire hace la
 * separación. Toda la tarjeta es un solo botón de apertura con foco visible.
 */
export const EstiloModerno: React.FC<PlantillaMenuProps> = ({
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
            <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold font-title tracking-[-0.02em] min-w-0"
                style={{ color: estilos.title }}
              >
                {categoria}
              </h2>
              <span className="text-xs font-semibold tabular-nums shrink-0 pb-1.5" style={{ color: estilos.muted }}>
                {platillos.length} {platillos.length === 1 ? 'plato' : 'platos'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {platillos.map((p) => (
                <article key={p.id} className="card-af-resto af-zoom relative flex flex-col overflow-hidden">
                  <AbrirPlatillo platillo={p} onVer={onVerPlatillo} radio="rounded-[20px]" />

                  <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: estilos.surface }}>
                    <FotoPlatillo platillo={p} estilos={estilos} clase="w-full h-full" icono={30} />

                    {p.destacado && p.disponible && (
                      <ChipDestacado estilos={estilos} className="absolute top-3 left-3" />
                    )}

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

                    {p.ingredientes && p.ingredientes.length > 0 && (
                      <p className="text-xs mt-2 line-clamp-1 break-words" style={{ color: estilos.muted, opacity: 0.85 }}>
                        {p.ingredientes.join(' · ')}
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
