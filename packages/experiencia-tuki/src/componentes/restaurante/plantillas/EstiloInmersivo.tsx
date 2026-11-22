import React from 'react';
import type { PlantillaMenuProps } from './tipos';
import { AbrirPlatillo, BotonAgregar, ChipDestacado, FotoPlatillo } from './piezas';
import { EtiquetasPlatillo } from '../EtiquetasPlatillo';

/**
 * Inmersivo: fotos grandes a sangre con el texto en una tarjeta de superficie
 * al pie. Sin velo oscuro sobre la foto: la legibilidad la resuelve el panel.
 */
export const EstiloInmersivo: React.FC<PlantillaMenuProps> = ({
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
            <h2
              className="text-center text-3xl sm:text-4xl md:text-5xl font-bold font-title tracking-[-0.03em] mb-8 sm:mb-11"
              style={{ color: estilos.title }}
            >
              {categoria}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {platillos.map((p) => (
                <article
                  key={p.id}
                  className="af-zoom relative aspect-[4/3] overflow-hidden rounded-[22px]"
                  style={{ backgroundColor: estilos.surface }}
                >
                  <AbrirPlatillo platillo={p} onVer={onVerPlatillo} radio="rounded-[22px]" />
                  <div className="absolute inset-0">
                    <FotoPlatillo platillo={p} estilos={estilos} clase="w-full h-full" icono={32} />
                  </div>

                  <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                    {p.destacado && p.disponible ? <ChipDestacado estilos={estilos} /> : <span />}
                    <span
                      className="pointer-events-none ml-auto shrink-0 px-3 py-1.5 rounded-full text-sm font-bold tabular-nums"
                      style={
                        p.disponible
                          ? { backgroundColor: estilos.precioFondo, color: estilos.precio }
                          : { backgroundColor: 'rgb(var(--af-surface-rgb) / 0.96)', color: 'rgb(var(--af-ink-rgb))', border: '1px solid rgb(var(--af-border-rgb))' }
                      }
                    >
                      ${p.precio.toLocaleString()}
                    </span>
                  </div>

                  <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 z-10">
                    <div
                      className="rounded-[18px] p-4 sm:p-5"
                      style={{ backgroundColor: estilos.cardBg, border: estilos.cardBorder }}
                    >
                      <h3 className="font-bold font-title leading-tight text-lg sm:text-2xl line-clamp-2 tracking-[-0.015em]" style={{ color: estilos.title }}>
                        {p.nombre}
                      </h3>
                      {p.descripcion && (
                        <p className="text-[13px] mt-1.5 line-clamp-2 leading-relaxed" style={{ color: estilos.muted }}>{p.descripcion}</p>
                      )}

                      <div className="mt-3.5 flex flex-wrap items-end justify-between gap-3">
                        <EtiquetasPlatillo platillo={p} compacto />
                        <div className="pointer-events-auto relative z-20 ml-auto">
                          <BotonAgregar
                            platillo={p}
                            estilos={estilos}
                            localAbierto={localAbierto}
                            variante="suave"
                            soloIconoEnMovil
                            onAgregar={(e) => onAgregarAlCarrito(p, e)}
                          />
                        </div>
                      </div>
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
