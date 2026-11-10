import React from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import type { ItemCarrito } from '../../modulos/pedidos';
import { formatearPrecio } from '../../lib/utils';
import { ETIQUETA, FOCO, TARJETA } from './estilos';

interface ResumenCarritoProps {
  carrito: ItemCarrito[];
  cantidad: number;
  total: number;
  onAbrir: () => void;
}

/**
 * El carrito en la columna de escritorio.
 *
 * Es un resumen, no el carrito entero: enseña los tres primeros platos y
 * delega el resto en la hoja, que es donde se editan cantidades y se cierra el
 * pedido por WhatsApp. Sin carrito explica qué hacer, sin dramatizar.
 */
export const ResumenCarrito: React.FC<ResumenCarritoProps> = ({
  carrito,
  cantidad,
  total,
  onAbrir,
}) => {
  const visibles = carrito.slice(0, 3);
  const restantes = carrito.length - visibles.length;
  const restaurante = carrito[0]?.restaurante_nombre;

  return (
    <section aria-labelledby="titulo-carrito-resumen" className={`${TARJETA} p-5`}>
      <div className="flex items-center justify-between gap-3 border-b border-hearth-line/70 pb-3 dark:border-hearth-night-line">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-hearth-terracotta-soft text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink">
            <ShoppingBag size={17} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2
              id="titulo-carrito-resumen"
              className="truncate font-jakarta text-sm font-extrabold text-hearth-espresso dark:text-hearth-night-ink"
            >
              Mi pedido
            </h2>
            {restaurante && (
              <p className="truncate text-[11px] text-hearth-pebble dark:text-hearth-night-pebble">
                {restaurante}
              </p>
            )}
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-hearth-terracotta-soft px-2.5 py-0.5 text-[11px] font-extrabold tabular-nums text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink">
          {cantidad} {cantidad === 1 ? 'ítem' : 'ítems'}
        </span>
      </div>

      {carrito.length === 0 ? (
        <div className="py-4">
          <p className="text-[13px] font-bold text-hearth-espresso dark:text-hearth-night-ink">
            Tu pedido está vacío
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
            Añade un plato con el botón + y aparecerá aquí.
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-3 space-y-2">
            {visibles.map((item) => (
              <li
                key={item.platillo.id}
                className="flex items-center gap-2.5 rounded-xl bg-hearth-oat/60 p-2 ring-1 ring-hearth-line/50 dark:bg-hearth-night-oat/60 dark:ring-hearth-night-line/60"
              >
                {item.platillo.imagen_url ? (
                  <img
                    src={item.platillo.imagen_url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-9 w-9 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hearth-card text-hearth-pebble dark:bg-hearth-night-card dark:text-hearth-night-pebble">
                    <ShoppingBag size={14} aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-hearth-espresso dark:text-hearth-night-ink">
                    {item.platillo.nombre}
                  </p>
                  <p className="text-[10.5px] tabular-nums text-hearth-pebble dark:text-hearth-night-pebble">
                    {item.cantidad} × {formatearPrecio(item.platillo.precio)}
                  </p>
                </div>
                <span className="shrink-0 text-[11.5px] font-extrabold tabular-nums text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink">
                  {formatearPrecio(item.platillo.precio * item.cantidad)}
                </span>
              </li>
            ))}
          </ul>

          {restantes > 0 && (
            <p className="mt-2 text-[11px] font-semibold text-hearth-pebble dark:text-hearth-night-pebble">
              y {restantes} {restantes === 1 ? 'plato más' : 'platos más'}
            </p>
          )}

          <div className="mt-3 flex items-baseline justify-between border-t border-hearth-line/70 pt-3 dark:border-hearth-night-line">
            <span className={`${ETIQUETA} text-[9px] text-hearth-pebble dark:text-hearth-night-pebble`}>
              Total estimado
            </span>
            <span className="font-jakarta text-lg font-extrabold tabular-nums text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink">
              {formatearPrecio(total)}
            </span>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={onAbrir}
        className={`af-pulsar mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-hearth-terracotta-deep px-4 py-3 text-[13px] font-extrabold text-white shadow-warm transition-colors hover:bg-hearth-terracotta-ink dark:bg-hearth-night-terracotta dark:text-hearth-night dark:hover:bg-[#F6A184] ${FOCO}`}
      >
        {carrito.length === 0 ? 'Ver platos' : 'Revisar y pedir'}
        <ArrowRight size={16} aria-hidden="true" />
      </button>

      <p className="mt-2.5 text-center text-[10.5px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
        El pedido se confirma por WhatsApp con el restaurante.
      </p>
    </section>
  );
};
