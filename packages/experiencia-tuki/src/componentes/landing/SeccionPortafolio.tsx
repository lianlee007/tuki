import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, MapPin, UtensilsCrossed } from 'lucide-react';
import { apis, intentar } from '../../lib/api-tuki';
import { Contenedor, ImagenInteligente, Seccion } from '../ui';
import { EncabezadoSeccion } from './EncabezadoSeccion';

/** El dato que se dibuja, ya normalizado. */
interface Ejemplo {
  id: string;
  nombre: string;
  eslogan: string | null;
  municipio: string | null;
  logo: string | null;
  banner: string | null;
  platos: number;
}

/**
 * Prueba social: restaurantes que ya están publicados.
 *
 * Son tarjetas con la portada real del restaurante, no una tira de pastillas.
 * La diferencia no es decorativa: una pastilla dice «existe», y una tarjeta con
 * su propia foto, su ciudad y cuántos platos tiene dice «esto funciona y se ve
 * así», que es lo que un dueño de restaurante necesita ver antes de decidirse.
 *
 * Seis y no más: dos filas completas de tres. Una séptima tarjeta suelta en una
 * tercera fila alarga la página sin añadir prueba.
 *
 * Si todavía no hay restaurantes publicados no se dibuja nada, ni el título: un
 * «sé el primero» en medio de una página de venta es una promesa vacía, y un
 * encabezado sin contenido debajo se lee como un error.
 */
export const SeccionPortafolio: React.FC = () => {
  const [ejemplos, setEjemplos] = useState<Ejemplo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const { data } = await intentar(() => apis.restaurantes.listar({ limite: 6 }));

      if (data) {
        setEjemplos(
          data.items
            .filter((restaurante) => restaurante.imagenBannerUrl)
            .map((restaurante) => ({
              id: restaurante.slug,
              nombre: restaurante.nombre,
              eslogan: restaurante.eslogan,
              municipio: restaurante.ciudad,
              logo: restaurante.imagenLogoUrl,
              banner: restaurante.imagenBannerUrl,
              platos: restaurante.platosCantidad,
            })),
        );
      }
      setCargando(false);
    };
    cargar();
  }, []);

  if (cargando || ejemplos.length === 0) return null;

  return (
    <Seccion padding="mediano" fondo="claro" className="!py-14 md:!py-24">
      <Contenedor maxAncho="grande">
        <div>
          <EncabezadoSeccion
            alineacion="izquierda"
            titulo="Restaurantes que ya venden con TukiTuki"
            descripcion="Menús publicados y recibiendo pedidos hoy."
          />
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ejemplos.map((rest, i) => (
            <div
              key={rest.id}
              className={`h-full ${i >= 3 ? 'hidden sm:block' : ''}`}
            >
              <Link
                to={`/restaurante/${rest.id}`}
                className="af-tarjeta af-tarjeta--interactiva af-pulsar group flex h-full items-center gap-3 overflow-hidden rounded-2xl bg-hearth-card p-3 sm:flex-col sm:items-stretch sm:gap-0 sm:rounded-[22px] sm:p-0 dark:bg-hearth-night-card"
              >
                <div className="af-zoom relative h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:aspect-[16/10] sm:h-auto sm:w-full sm:rounded-none">
                  <ImagenInteligente
                    src={rest.banner}
                    alt={`Menú de ${rest.nombre}`}
                    className="h-full w-full"
                  />
                  <span className="absolute left-3 top-3 hidden items-center gap-1.5 rounded-full bg-hearth-cream/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-hearth-espresso sm:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-af-success" aria-hidden="true" />
                    En línea
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-3 sm:items-start sm:p-4">
                  <span className="hidden h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-af-accent-solid text-base font-bold text-white sm:grid">
                    {rest.logo ? (
                      <ImagenInteligente src={rest.logo} alt="" className="h-full w-full" />
                    ) : (
                      rest.nombre.charAt(0).toUpperCase()
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-bold text-af-ink">{rest.nombre}</h3>

                    <p className="mt-0.5 truncate text-[13px] text-af-ink-secondary">
                      {rest.eslogan || 'Menú digital'}
                    </p>

                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-af-ink-secondary sm:mt-2">
                      {rest.municipio && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} strokeWidth={2.4} aria-hidden="true" />
                          {rest.municipio}
                        </span>
                      )}
                      {rest.platos > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <UtensilsCrossed size={12} strokeWidth={2.4} aria-hidden="true" />
                          {rest.platos} {rest.platos === 1 ? 'plato' : 'platos'}
                        </span>
                      )}
                    </p>
                  </div>

                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 text-af-ink-secondary/50 sm:hidden"
                  />
                </div>

                <div className="mt-auto hidden items-center justify-between border-t border-af-border/60 px-4 py-3 text-[12px] font-semibold text-af-accent-text sm:flex">
                  Ver menú
                  <ArrowUpRight
                    size={15}
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </Contenedor>
    </Seccion>
  );
};
