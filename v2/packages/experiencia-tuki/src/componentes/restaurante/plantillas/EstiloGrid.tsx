import React from 'react';
import type { PlantillaMenuProps } from './tipos';
import { AbrirPlatillo, BotonAgregar, ChipAgotado, ChipDestacado, FotoPlatillo } from './piezas';
import { EtiquetasPlatillo } from '../EtiquetasPlatillo';

/* Velo de legibilidad. No es decoración: garantiza que el blanco del texto
   cumpla contraste sobre cualquier foto, en claro y en oscuro. */
const VELO_ANCHO = 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.80) 38%, rgba(0,0,0,0.44) 66%, rgba(0,0,0,0.12) 86%, rgba(0,0,0,0) 100%)';
const VELO_TARTA = 'linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.88) 32%, rgba(0,0,0,0.62) 58%, rgba(0,0,0,0.18) 80%, rgba(0,0,0,0) 100%)';

/**
 * Editorial: cuadrícula tipo revista. Se sustituyeron el numeral gigante y la
 * regla de 1 px por ritmo real: el primer plato de cada sección se presenta a
 * lo ancho como apertura y el resto cae en una retícula de retratos 4:5.
 *
 * Todo el texto va sobre un velo oscuro (nunca sobre el color de marca), así que
 * el blanco es legible en claro y en oscuro, con cualquier paleta.
 */
export const EstiloGrid: React.FC<PlantillaMenuProps> = ({
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

        const [portada, ...resto] = platillos;

        return (
          <section
            key={categoria}
            id={`cat-${categoria}`}
            ref={(el) => { refs.current[categoria] = el; }}
            className={`af-ancla ${indiceCat > 0 ? 'mt-16 sm:mt-24' : ''}`}
          >
            <div className="flex items-end justify-between gap-4 mb-5 sm:mb-7">
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

            {/* Apertura: el plato que presenta la sección */}
            <article
              className="af-zoom relative aspect-[3/2] lg:aspect-[21/9] overflow-hidden rounded-[22px] mb-3 sm:mb-4"
              style={{ backgroundColor: estilos.surface }}
            >
              <AbrirPlatillo platillo={portada} onVer={onVerPlatillo} radio="rounded-[22px]" />
              <div className="absolute inset-0">
                <FotoPlatillo platillo={portada} estilos={estilos} clase="w-full h-full" icono={40} />
              </div>
              <div className="pointer-events-none absolute inset-0" style={{ background: VELO_ANCHO }} />

              <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                {portada.destacado && portada.disponible ? <ChipDestacado estilos={estilos} /> : <span />}
                {!portada.disponible && <ChipAgotado className="ml-auto" />}
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col p-5 sm:p-7 lg:p-9">
                <h3 className="text-white font-bold font-title leading-[1.08] tracking-[-0.02em] text-2xl sm:text-3xl lg:text-4xl line-clamp-2 max-w-3xl">
                  {portada.nombre}
                </h3>
                {portada.descripcion && (
                  <p className="text-white/85 text-sm mt-2 line-clamp-2 leading-relaxed max-w-2xl">{portada.descripcion}</p>
                )}
                <div className="mt-3.5 flex flex-wrap items-end justify-between gap-3">
                  <EtiquetasPlatillo platillo={portada} compacto sobreImagen />
                  <div className="pointer-events-auto relative z-20 ml-auto flex items-center gap-3">
                    <span
                      className="relative z-20 shrink-0 rounded-full px-3 py-1 text-base sm:text-lg font-bold tabular-nums"
                      style={{ backgroundColor: estilos.accentSoft, color: estilos.precio }}
                    >
                      ${portada.precio.toLocaleString()}
                    </span>
                    <BotonAgregar
                      platillo={portada}
                      estilos={estilos}
                      localAbierto={localAbierto}
                      variante="cristal"
                      onAgregar={(e) => onAgregarAlCarrito(portada, e)}
                    />
                  </div>
                </div>
              </div>
            </article>

            {resto.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {resto.map((p) => (
                  <article
                    key={p.id}
                    className="af-zoom relative aspect-[4/5] overflow-hidden rounded-[18px]"
                    style={{ backgroundColor: estilos.surface }}
                  >
                    <AbrirPlatillo platillo={p} onVer={onVerPlatillo} radio="rounded-[18px]" />
                    <div className="absolute inset-0">
                      <FotoPlatillo platillo={p} estilos={estilos} clase="w-full h-full" icono={28} />
                    </div>
                    <div className="pointer-events-none absolute inset-0" style={{ background: VELO_TARTA }} />

                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                      {p.destacado && p.disponible ? <ChipDestacado estilos={estilos} texto="Top" /> : <span />}
                      {!p.disponible && <ChipAgotado className="ml-auto" />}
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col p-3.5 sm:p-4">
                      <h3 className="text-white font-bold font-title leading-snug text-[15px] sm:text-base line-clamp-2">
                        {p.nombre}
                      </h3>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <span
                          className="shrink-0 rounded-full px-2.5 py-0.5 text-[15px] sm:text-base font-bold tabular-nums"
                          style={{ backgroundColor: estilos.accentSoft, color: estilos.precio }}
                        >
                          ${p.precio.toLocaleString()}
                        </span>
                        <div className="pointer-events-auto relative z-20">
                          <BotonAgregar
                            platillo={p}
                            estilos={estilos}
                            localAbierto={localAbierto}
                            variante="cristal"
                            soloIconoEnMovil
                            onAgregar={(e) => onAgregarAlCarrito(p, e)}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};
