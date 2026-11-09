import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, UtensilsCrossed } from 'lucide-react';
import { apis, intentar } from '../../lib/api-tuki';
import { Contenedor, ImagenInteligente, Seccion } from '../ui';
import { Revelar } from './Revelar';

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
    <Seccion padding="mediano">
      <Contenedor maxAncho="grande">
        <Revelar>
          <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-af-accent-text">
            Ya están en línea
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center font-jakarta text-2xl font-extrabold tracking-[-0.03em] text-af-ink sm:text-3xl">
            Restaurantes que ya reciben pedidos con TukiTuki
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-base text-af-ink-secondary">
            Menús publicados y funcionando hoy mismo.
          </p>
        </Revelar>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ejemplos.map((rest, i) => (
            <Revelar key={rest.id} retraso={i * 60}>
              <Link
                to={`/restaurante/${rest.id}`}
                className="af-pulsar group flex h-full flex-col overflow-hidden rounded-3xl bg-hearth-card ring-1 ring-hearth-line/70 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-warm-lg dark:bg-hearth-night-card dark:ring-hearth-night-line/80 dark:hover:shadow-warm-dark"
              >
                <div className="af-zoom relative aspect-[16/10] overflow-hidden">
                  <ImagenInteligente
                    src={rest.banner}
                    alt={`Menú de ${rest.nombre}`}
                    className="h-full w-full"
                  />
                </div>

                <div className="flex flex-1 items-start gap-3 p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-af-accent text-base font-bold text-white">
                    {rest.logo ? (
                      <ImagenInteligente src={rest.logo} alt="" className="h-full w-full" />
                    ) : (
                      rest.nombre.charAt(0).toUpperCase()
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-1 text-base font-semibold text-af-ink">
                      <span className="truncate">{rest.nombre}</span>
                      <ArrowUpRight
                        size={15}
                        className="shrink-0 text-af-ink-secondary opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      />
                    </h3>

                    <p className="mt-0.5 truncate text-sm text-af-ink-secondary">
                      {rest.eslogan || 'Menú digital'}
                    </p>

                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-af-ink-secondary">
                      {rest.municipio && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} strokeWidth={2.4} />
                          {rest.municipio}
                        </span>
                      )}
                      {rest.platos > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <UtensilsCrossed size={12} strokeWidth={2.4} />
                          {rest.platos} {rest.platos === 1 ? 'plato' : 'platos'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            </Revelar>
          ))}
        </div>
      </Contenedor>
    </Seccion>
  );
};
