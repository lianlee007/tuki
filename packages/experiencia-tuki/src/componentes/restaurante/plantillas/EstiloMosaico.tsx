import React from 'react';
import type { PlantillaMenuProps } from './tipos';
import { AbrirPlatillo, BotonAgregar, ChipAgotado, ChipDestacado, FotoPlatillo } from './piezas';

/**
 * Mosaico: un muro de fotos sin canalillos, donde cada seis piezas una ocupa el
 * doble. El reparto lo resuelve `grid-auto-flow: dense`, así que no quedan
 * huecos por mucho que el número de platos no sea redondo.
 *
 * El texto va en una tarjeta de superficie al pie de cada pieza: la foto queda
 * limpia, sin velo.
 */
export const EstiloMosaico: React.FC<PlantillaMenuProps> = ({
  categorias,
  menuPorCategoria,
  estilos,
  refs,
  onVerPlatillo,
  onAgregarAlCarrito,
  localAbierto,
}) => {
  /**
   * Reparto del mosaico. El cuerpo se repite cada seis piezas con un ciclo cuyo
   * recuento de celdas es múltiplo de cuatro (cierra cada tres filas sin
   * huecos), y la cola —lo que sobra— usa una plantilla propia por total, que
   * arranca siempre en un borde de fila. Resultado: el muro cierra al 100 % con
   * cualquier número de platos, a dos columnas y a cuatro.
   */
  const repartoCola = (i: number, total: number) => {
    if (total === 1) return 'col-span-2 sm:col-span-4 row-span-2';
    if (total === 2) return 'col-span-2 row-span-2';
    if (total === 4) return i === 0 ? 'col-span-2 row-span-2' : i === 3 ? 'col-span-2 row-span-1' : '';
    return i === 0 ? 'col-span-2 row-span-2' : 'col-span-2 row-span-1';
  };

  const reparto = (i: number, total: number) => {
    const cola = total % 6;
    const cuerpo = total - cola;
    if (cola > 0 && i >= cuerpo) return repartoCola(i - cuerpo, cola);
    const m = i % 6;
    if (m === 0) return 'col-span-2 row-span-2';
    if (m === 1 || m === 2 || m === 5) return 'col-span-2 row-span-1';
    return '';
  };

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

            <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-[132px] sm:auto-rows-[168px] lg:auto-rows-[196px] gap-1.5 sm:gap-2 [grid-auto-flow:dense]">
              {platillos.map((p, i) => {
                const clase = reparto(i, platillos.length);
                const grande = clase.indexOf('row-span-2') >= 0;
                return (
                  <article
                    key={p.id}
                    className={`af-zoom relative overflow-hidden rounded-[14px] ${clase}`}
                    style={{ backgroundColor: estilos.surface }}
                  >
                    <AbrirPlatillo platillo={p} onVer={onVerPlatillo} radio="rounded-[14px]" />
                    <div className="absolute inset-0">
                      <FotoPlatillo platillo={p} estilos={estilos} clase="w-full h-full" icono={grande ? 34 : 22} />
                    </div>

                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2">
                      {p.destacado && p.disponible ? <ChipDestacado estilos={estilos} texto={grande ? 'Destacado' : 'Top'} /> : <span />}
                      {!p.disponible && <ChipAgotado className="ml-auto" />}
                    </div>

                    <div className="pointer-events-none absolute inset-x-1.5 bottom-1.5 z-10">
                      <div className={`rounded-[10px] ${grande ? 'p-3' : 'p-2'}`} style={{ backgroundColor: estilos.cardBg, border: estilos.cardBorder }}>
                        <h3
                          className={`font-bold font-title leading-snug line-clamp-2 ${grande ? 'text-lg sm:text-2xl' : 'text-[12px] sm:text-[15px]'}`}
                          style={{ color: estilos.title }}
                        >
                          {p.nombre}
                        </h3>
                        {grande && p.descripcion && (
                          <p className="text-[13px] mt-1.5 line-clamp-2 leading-relaxed max-w-xl" style={{ color: estilos.muted }}>{p.descripcion}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span
                            className={`shrink-0 rounded-full font-bold tabular-nums ${grande ? 'px-2.5 py-1 text-base sm:text-lg' : 'px-2 py-0.5 text-[13px] sm:text-sm'}`}
                            style={{ backgroundColor: estilos.accentSoft, color: estilos.precio }}
                          >
                            ${p.precio.toLocaleString()}
                          </span>
                          <div className="pointer-events-auto relative z-20">
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
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
