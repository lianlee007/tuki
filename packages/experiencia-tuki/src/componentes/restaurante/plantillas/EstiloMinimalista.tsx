import React from 'react';
import { Star } from 'lucide-react';
import type { PlantillaMenuProps } from './tipos';
import { AbrirPlatillo, BotonAgregar, FotoPlatillo } from './piezas';
import { EtiquetasPlatillo } from '../EtiquetasPlatillo';

/**
 * Minimal: el plato manda. Se eliminaron la ceja "01 — Sección" y las reglas de
 * 1 px entre platos; ahora la separación es puro aire, que es lo que hace que
 * una carta corta se lea como una pieza y no como una tabla.
 *
 * Es la estructura pensada para cocina de autor: pocos platos, tipografía
 * grande y ningún contenedor compitiendo con el nombre.
 */
export const EstiloMinimalista: React.FC<PlantillaMenuProps> = ({
  categorias,
  menuPorCategoria,
  estilos,
  refs,
  onVerPlatillo,
  onAgregarAlCarrito,
  localAbierto,
}) => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
      {categorias.map((categoria, indiceCat) => {
        const platillos = menuPorCategoria[categoria] || [];
        if (platillos.length === 0) return null;

        return (
          <section
            key={categoria}
            id={`cat-${categoria}`}
            ref={(el) => { refs.current[categoria] = el; }}
            className={`af-ancla ${indiceCat > 0 ? 'mt-20 sm:mt-28' : ''}`}
          >
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-semibold font-title tracking-[-0.035em] leading-[1.05] mb-2"
              style={{ color: estilos.title }}
            >
              {categoria}
            </h2>
            <p className="text-xs font-semibold tabular-nums mb-10 sm:mb-14" style={{ color: estilos.muted }}>
              {platillos.length} {platillos.length === 1 ? 'plato' : 'platos'}
            </p>

            <div>
              {platillos.map((p) => {
                const agotado = !p.disponible;
                return (
                  <article key={p.id} className="af-zoom relative py-7 sm:py-8">
                    <AbrirPlatillo platillo={p} onVer={onVerPlatillo} radio="rounded-2xl" />

                    <div className="flex items-baseline gap-5">
                      {p.imagen_url && (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 self-start" style={{ backgroundColor: estilos.surface }}>
                          <FotoPlatillo platillo={p} estilos={estilos} clase="w-full h-full" icono={20} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-4">
                          <h3
                            className="text-xl sm:text-2xl font-title font-semibold leading-snug min-w-0 break-words"
                            style={{
                              color: estilos.title,
                              textDecoration: agotado ? 'line-through' : 'none',
                              opacity: agotado ? 0.55 : 1,
                            }}
                          >
                            {p.destacado && (
                              <Star size={14} className="inline-block align-[-2px] mr-1.5" style={{ color: estilos.secondaryText }} fill="currentColor" />
                            )}
                            {p.nombre}
                          </h3>
                          <span
                            className="shrink-0 rounded-full px-3 py-1 text-lg sm:text-xl font-semibold tabular-nums"
                            style={{ backgroundColor: estilos.precioFondo, color: estilos.precio }}
                          >
                            ${p.precio.toLocaleString()}
                          </span>
                        </div>

                        {p.descripcion && (
                          <p className="mt-2 text-sm leading-relaxed max-w-2xl break-words" style={{ color: estilos.muted }}>
                            {p.descripcion}
                          </p>
                        )}

                        {p.ingredientes && p.ingredientes.length > 0 && (
                          <p className="mt-1.5 text-xs leading-relaxed break-words" style={{ color: estilos.muted, opacity: 0.8 }}>
                            {p.ingredientes.join(' · ')}
                          </p>
                        )}

                        <div className="relative z-20 mt-3 flex items-center gap-3 flex-wrap">
                          <EtiquetasPlatillo platillo={p} compacto className="pointer-events-none" />
                          <BotonAgregar
                            platillo={p}
                            estilos={estilos}
                            localAbierto={localAbierto}
                            variante="texto"
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
