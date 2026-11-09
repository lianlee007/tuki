import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Contenedor, Logo, ThemeToggle, SEO } from '../ui';

/**
 * Identidad del proveedor.
 *
 * Estos datos son de ejemplo y están aquí para que los documentos no salgan con
 * huecos: Tuki es un proyecto universitario y no se publica. El día que fuera un
 * servicio real, razón social, NIT, domicilio y teléfono serían lo primero que
 * habría que reemplazar por los de verdad, porque el artículo 50 de la Ley 1480
 * de 2011 exige que estén visibles en cualquier sitio que venda a distancia.
 */
export const EMPRESA = {
  marca: 'Tuki',
  razonSocial: 'Tuki S.A.S.',
  nit: '901.654.321-8',
  domicilio: 'Carrera 8 # 3-15, Popayán, Cauca, Colombia',
  telefono: '+57 300 555 0199',
  correo: 'hola@tuki.app',
  sitio: 'tuki.app',
  actualizado: '18 de octubre de 2026',
};

export interface Clausula {
  /** Ancla de la cláusula, para el índice y para poder citarla. */
  id: string;
  titulo: string;
  cuerpo: React.ReactNode;
}

/**
 * Armazón de un documento legal.
 *
 * Vivía duplicado en Términos y en Privacidad, con la navegación copiada y una
 * tarjeta con borde de 1 píxel por cláusula —que es justo lo que la casa no
 * quiere—. Aquí el documento fluye: titular, entradilla, un resumen de tres
 * líneas para quien no va a leer catorce cláusulas, un índice que lleva a cada
 * una y las cláusulas separadas por aire.
 *
 * El resumen es informativo y lo dice: nunca puede sustituir al texto, y un
 * resumen que no se declara como tal es una promesa que nadie firmó.
 */
export const MarcoLegal: React.FC<{
  titulo: string;
  /** Descripción para buscadores y para compartir. */
  descripcion: string;
  entradilla: string;
  /** Tres o cuatro frases para quien no va a leer el documento entero. */
  resumen: React.ReactNode[];
  clausulas: Clausula[];
  cierre: React.ReactNode;
}> = ({ titulo, descripcion, entradilla, resumen, clausulas, cierre }) => (
  <div className="af-legal min-h-screen bg-af-ground font-system text-af-ink">
    <SEO titulo={`${titulo} | ${EMPRESA.marca}`} descripcion={descripcion} />

    <nav className="nav-af fixed top-0 z-50 w-full">
      <Contenedor maxAncho="grande">
        <div className="flex h-16 items-center justify-between sm:h-20 md:h-24">
          <Link to="/para-restaurantes" className="flex items-center gap-3" aria-label={`${EMPRESA.marca}, ir al inicio`}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-af-accent-solid text-white">
              <Logo size={20} />
            </span>
            <span className="text-xl font-bold tracking-tight text-af-ink">{EMPRESA.marca}</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/para-restaurantes"
              title="Volver al inicio"
              aria-label="Volver al inicio"
              className="af-pulsar grid h-10 w-10 place-items-center rounded-full bg-af-surface text-af-ink"
            >
              <ArrowLeft size={18} />
            </Link>
          </div>
        </div>
      </Contenedor>
    </nav>

    <main className="pb-24 pt-28 sm:pt-36">
      <Contenedor maxAncho="grande">
        <article className="mx-auto max-w-3xl">
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-af-ink sm:text-4xl">{titulo}</h1>
            <p className="mt-5 text-lg leading-relaxed text-af-ink-secondary">{entradilla}</p>
            <p className="mt-4 text-sm text-af-ink-secondary">
              Última actualización: {EMPRESA.actualizado}
            </p>
          </header>

          {resumen.length > 0 && (
            <section className="mt-10 rounded-3xl bg-af-surface p-6 sm:p-8">
              <h2 className="text-sm font-semibold text-af-ink">En resumen</h2>
              <ul className="af-legal__cuerpo mt-4 space-y-3 text-[15px] leading-relaxed text-af-ink-secondary">
                {resumen.map((linea, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-af-accent" />
                    <span>{linea}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-af-ink-secondary">
                Este resumen ayuda a leer el documento, pero no lo reemplaza: lo que rige es el texto
                completo de cada cláusula.
              </p>
            </section>
          )}

          <nav className="mt-14" aria-label="Contenido del documento">
            <h2 className="text-sm font-semibold text-af-ink">Contenido</h2>
            <ol className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
              {clausulas.map((c, i) => (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    className="af-pulsar flex gap-2 rounded-lg py-1.5 text-[15px] text-af-ink-secondary hover:text-af-accent-text"
                  >
                    <span className="tabular-nums">{i + 1}.</span>
                    <span>{c.titulo}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-16 space-y-14">
            {clausulas.map((c, i) => (
              <section key={c.id} id={c.id} className="scroll-mt-32">
                <h2 className="text-lg font-semibold tracking-tight text-af-ink sm:text-xl">
                  <span className="tabular-nums">{i + 1}.</span>{' '}
                  {c.titulo}
                </h2>
                <div className="af-legal__cuerpo mt-4 space-y-3.5 text-[15px] leading-relaxed text-af-ink-secondary">
                  {c.cuerpo}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-16">{cierre}</div>
        </article>
      </Contenedor>
    </main>

    <footer className="bg-af-surface py-12">
      <Contenedor maxAncho="grande">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-af-ink-secondary">
            {EMPRESA.razonSocial} · NIT {EMPRESA.nit} · {EMPRESA.domicilio}
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/terminos" className="text-af-ink-secondary hover:text-af-accent-text">
              Términos
            </Link>
            <Link to="/privacidad" className="text-af-ink-secondary hover:text-af-accent-text">
              Privacidad
            </Link>
          </div>
          <p className="text-xs text-af-ink-secondary">
            © {new Date().getFullYear()} {EMPRESA.razonSocial}. Todos los derechos reservados.
            Colombia.
          </p>
        </div>
      </Contenedor>
    </footer>
  </div>
);

/**
 * Bloque de cierre con los datos del proveedor.
 *
 * Es la ficha que exige el artículo 50 de la Ley 1480 de 2011 para vender a
 * distancia, y sirve además como canal único de PQRS y de habeas data.
 */
export const ContactoLegal: React.FC<{ nota: string }> = ({ nota }) => {
  const filas: { etiqueta: string; valor: React.ReactNode }[] = [
    { etiqueta: 'Razón social', valor: EMPRESA.razonSocial },
    { etiqueta: 'NIT', valor: EMPRESA.nit },
    { etiqueta: 'Domicilio', valor: EMPRESA.domicilio },
    { etiqueta: 'Teléfono', valor: EMPRESA.telefono },
    {
      etiqueta: 'Correo',
      valor: (
        <a href={`mailto:${EMPRESA.correo}`} className="text-af-accent-text">
          {EMPRESA.correo}
        </a>
      ),
    },
    { etiqueta: 'Sitio', valor: EMPRESA.sitio },
  ];

  return (
    <section className="rounded-3xl bg-af-surface p-6 sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight text-af-ink">Cómo contactarnos</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-af-ink-secondary">{nota}</p>

      <dl className="mt-6 space-y-2 text-[15px]">
        {filas.map((f) => (
          <div key={f.etiqueta} className="flex flex-wrap gap-x-2">
            <dt className="font-semibold text-af-ink">{f.etiqueta}:</dt>
            <dd className="text-af-ink-secondary">{f.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
