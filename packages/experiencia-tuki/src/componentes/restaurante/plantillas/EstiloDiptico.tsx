import React from 'react';
import type { PlantillaMenuProps } from './tipos';
import { AbrirPlatillo, BotonAgregar, ChipAgotado, ChipDestacado, FotoPlatillo } from './piezas';
import { EtiquetasPlatillo } from '../EtiquetasPlatillo';

/**
 * Díptico: cada plato es una franja a lo ancho partida en dos mitades —foto y
 * campo de color— y la foto alterna de lado. Es la estructura más "de estudio":
 * crea un ritmo de zigzag que ninguna otra tiene y da sitio de sobra a la
 * descripción sin apretar nada.
 *
 * Los dos campos alternan entre `surface` y `cardBg`, que son los dos escalones
 * de tono sobre los que la capa semántica ya garantizó la legibilidad del texto.
 */
export const EstiloDiptico: React.FC<PlantillaMenuProps> = ({
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
              className="text-2xl sm:text-3xl md:text-4xl font-bold font-title tracking-[-0.025em] mb-7 sm:mb-10"
              style={{ color: estilos.title }}
            >
              {categoria}
            </h2>

            <div className="flex flex-col gap-5 sm:gap-6">
              {platillos.map((p, i) => {
                const fotoDerecha = i % 2 === 1;
                return (
                  <article
                    key={p.id}
                    className="af-zoom relative grid md:grid-cols-2 overflow-hidden rounded-[24px]"
                    style={{ backgroundColor: fotoDerecha ? estilos.cardBg : estilos.surface }}
                  >
                    <AbrirPlatillo platillo={p} onVer={onVerPlatillo} radio="rounded-[24px]" />

                    <div className={`relative aspect-[16/10] md:aspect-auto overflow-hidden ${fotoDerecha ? 'md:order-2' : ''}`}>
                      <div className="absolute inset-0">
                        <FotoPlatillo platillo={p} estilos={estilos} clase="w-full h-full" icono={34} />
                      </div>
                      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                        {p.destacado && p.disponible ? <ChipDestacado estilos={estilos} /> : <span />}
                        {!p.disponible && <ChipAgotado className="ml-auto" texto="Agotado hoy" />}
                      </div>
                    </div>

                    <div className="relative p-6 sm:p-9 lg:p-11 flex flex-col justify-center">
                      <div className="flex items-start justify-between gap-4">
                        <h3
                          className="text-2xl sm:text-3xl font-bold font-title leading-[1.12] tracking-[-0.02em] break-words min-w-0"
                          style={{ color: estilos.title }}
                        >
                          {p.nombre}
                        </h3>
                        <span
                          className="shrink-0 rounded-full px-3 py-1.5 text-xl sm:text-2xl font-bold tabular-nums"
                          style={{ backgroundColor: estilos.accentSoft, color: estilos.precio }}
                        >
                          ${p.precio.toLocaleString()}
                        </span>
                      </div>

                      {p.descripcion && (
                        <p className="mt-3 text-sm sm:text-[15px] leading-relaxed break-words" style={{ color: estilos.muted }}>
                          {p.descripcion}
                        </p>
                      )}

                      {p.ingredientes && p.ingredientes.length > 0 && (
                        <p className="mt-2 text-xs leading-relaxed break-words" style={{ color: estilos.muted, opacity: 0.8 }}>
                          {p.ingredientes.join(' · ')}
                        </p>
                      )}

                      <div className="relative z-20 mt-6 flex items-center gap-3 flex-wrap">
                        <EtiquetasPlatillo platillo={p} compacto className="pointer-events-none" />
                        <BotonAgregar
                          platillo={p}
                          estilos={estilos}
                          localAbierto={localAbierto}
                          onAgregar={(e) => onAgregarAlCarrito(p, e)}
                        />
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
