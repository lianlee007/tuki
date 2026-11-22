import React from 'react';
import type { PlantillaMenuProps } from './tipos';
import { AbrirPlatillo, BotonAgregar, FotoPlatillo } from './piezas';
import { EtiquetasPlatillo } from '../EtiquetasPlatillo';
import { Lock, Star } from 'lucide-react';

/** Respeta a quien pidió menos movimiento en su sistema. */
const prefiereMenosMovimiento = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Compacta: la estructura para cartas largas. Filas de una sola línea, muy
 * densas y escaneables, con un índice de categorías fijo a la izquierda en
 * pantallas anchas. Es la más rápida de recorrer con el pulgar y la que menos
 * scroll necesita cuando hay cien platos.
 *
 * La separación entre filas es un paso de tono (fila sí, fila no), no una regla
 * de 1 px: se lee igual de bien y no añade cromo.
 */
export const EstiloCompacta: React.FC<PlantillaMenuProps> = ({
  categorias,
  menuPorCategoria,
  estilos,
  refs,
  onVerPlatillo,
  onAgregarAlCarrito,
  localAbierto,
}) => {
  const visibles = categorias.filter((c) => (menuPorCategoria[c] || []).length > 0);

  const irA = (categoria: string) => {
    refs.current[categoria]?.scrollIntoView({
      behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
      <div className="lg:grid lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-12">
        {visibles.length > 1 && (
          <nav aria-label="Ir a una categoría" className="hidden lg:block">
            <ul className="sticky space-y-0.5" style={{ top: 'calc(var(--af-nav-h, 108px) + 24px)' }}>
              {visibles.map((categoria) => (
                <li key={categoria}>
                  <button
                    type="button"
                    onClick={() => irA(categoria)}
                    className="block w-full text-left py-1.5 text-sm font-semibold rounded-lg af-pulsar hover:opacity-70 truncate"
                    style={{ color: estilos.muted }}
                    title={categoria}
                  >
                    {categoria}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className={visibles.length > 1 ? '' : 'lg:col-span-2'}>
          {visibles.map((categoria, indiceCat) => {
            const platillos = menuPorCategoria[categoria] || [];
            return (
              <section
                key={categoria}
                id={`cat-${categoria}`}
                ref={(el) => { refs.current[categoria] = el; }}
                className={`af-ancla ${indiceCat > 0 ? 'mt-14 sm:mt-20' : ''}`}
              >
                <h2
                  className="text-xl sm:text-2xl font-bold font-title tracking-[-0.02em] mb-3"
                  style={{ color: estilos.title }}
                >
                  {categoria}
                </h2>

                <div>
                  {platillos.map((p, i) => {
                    const agotado = !p.disponible;
                    return (
                      <article
                        key={p.id}
                        className="af-zoom relative flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-xl"
                        style={{ backgroundColor: i % 2 === 1 ? estilos.surface : 'transparent' }}
                      >
                        <AbrirPlatillo platillo={p} onVer={onVerPlatillo} radio="rounded-xl" />

                        {p.imagen_url && (
                          <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: estilos.surface }}>
                            <FotoPlatillo platillo={p} estilos={estilos} clase="w-full h-full" icono={16} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <h3
                              className="text-[15px] font-semibold leading-snug line-clamp-2 break-words min-w-0"
                              style={{ color: estilos.title, opacity: agotado ? 0.55 : 1 }}
                              title={p.nombre}
                            >
                              {p.nombre}
                            </h3>
                            {p.destacado && (
                              <Star size={12} className="shrink-0 translate-y-[1px]" style={{ color: estilos.secondaryText }} fill="currentColor" />
                            )}
                            {agotado && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold shrink-0" style={{ color: estilos.danger }}>
                                <Lock size={11} /> Agotado
                              </span>
                            )}
                          </div>
                          {p.descripcion && (
                            <p className="text-[13px] leading-snug line-clamp-1 break-words" style={{ color: estilos.muted }} title={p.descripcion}>
                              {p.descripcion}
                            </p>
                          )}
                        </div>

                        <EtiquetasPlatillo platillo={p} compacto className="pointer-events-none hidden sm:flex shrink-0" />

                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[15px] font-bold tabular-nums"
                          style={{ backgroundColor: estilos.precioFondo, color: estilos.precio }}
                        >
                          ${p.precio.toLocaleString()}
                        </span>

                        <div className="relative z-20 shrink-0">
                          <BotonAgregar
                            platillo={p}
                            estilos={estilos}
                            localAbierto={localAbierto}
                            variante="suave"
                            soloIconoEnMovil
                            onAgregar={(e) => onAgregarAlCarrito(p, e)}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
