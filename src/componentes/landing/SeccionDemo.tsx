import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { Contenedor, Seccion } from '../ui';
import { MarcoPortatil, MarcoTablet, MarcoTelefono, type Dispositivo } from './Marcos';
import { MenuDemo } from './MenuDemo';

const APARATOS: { id: Dispositivo; etiqueta: string; icono: React.ElementType }[] = [
  { id: 'movil', etiqueta: 'Móvil', icono: Smartphone },
  { id: 'tablet', etiqueta: 'Tablet', icono: Tablet },
  { id: 'pc', etiqueta: 'Escritorio', icono: Monitor },
];

const slug = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'tu-restaurante';

/**
 * «Así se ve tu menú».
 *
 * Es la sección que responde la pregunta que de verdad trae el visitante: cómo
 * va a quedar SU restaurante, no cómo funciona la plataforma. Por eso se puede
 * escribir el nombre y por eso se puede cambiar de aparato: al escribir su
 * propio nombre en la carta, el menú deja de ser una demostración y pasa a ser
 * suyo (efecto de dotación, el mismo motivo por el que las tiendas de ropa
 * tienen espejos).
 *
 * El selector de aparato solo aparece desde `lg`. Por debajo, la tableta de
 * 660 px y el portátil de 856 px no caben sin encogerlos hasta que dejan de
 * parecer aparatos, así que en el teléfono se muestra la vista de teléfono —
 * que además es la que usa nueve de cada diez comensales.
 */
export const SeccionDemo: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [dispositivo, setDispositivo] = useState<Dispositivo>('movil');

  useEffect(() => {
    const consulta = window.matchMedia('(min-width: 1024px)');
    const ajustar = () => setDispositivo(consulta.matches ? 'pc' : 'movil');
    ajustar();
    consulta.addEventListener('change', ajustar);
    return () => consulta.removeEventListener('change', ajustar);
  }, []);

  return (
    <Seccion id="ejemplos" padding="grande" fondo="claro">
      <Contenedor maxAncho="grande">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-af-accent-text">
            Así se ve
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-af-ink md:text-5xl">
            Míralo en la pantalla de tus clientes
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-af-ink-secondary">
            Escribe el nombre de tu restaurante y cámbialo de aparato. Lo que ves es
            exactamente lo que ven ellos.
          </p>
        </div>

        <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <label className="sr-only" htmlFor="demo-nombre">
            Nombre de tu restaurante
          </label>
          <input
            id="demo-nombre"
            type="text"
            className="input-af w-full sm:max-w-xs"
            placeholder="Nombre de tu restaurante"
            value={nombre}
            maxLength={28}
            autoComplete="off"
            onChange={(e) => setNombre(e.target.value)}
          />

          <div className="hidden items-center gap-1 rounded-xl bg-hearth-oat/80 p-1 ring-1 ring-hearth-line/60 lg:flex dark:bg-hearth-night-oat dark:ring-hearth-night-line/70">
            {APARATOS.map(({ id, etiqueta, icono: Icono }) => {
              const activo = dispositivo === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDispositivo(id)}
                  aria-pressed={activo}
                  title={etiqueta}
                  className={`af-pulsar flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    activo
                      ? 'bg-hearth-card text-hearth-espresso shadow-warm dark:bg-hearth-night-card dark:text-hearth-night-ink'
                      : 'text-af-ink-secondary hover:text-af-ink'
                  }`}
                >
                  <Icono size={16} strokeWidth={2} />
                  <span className="hidden xl:inline">{etiqueta}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* La clave del cambio de aparato hace que la vista entre con un fundido
            corto. El marco cambia de tamaño en el acto —es un objeto, no un
            contenedor que se estira— y el fundido tapa el salto. */}
        <div className="mt-14 flex min-h-[600px] items-start justify-center">
          <div key={dispositivo} className="af-entrada-velo" aria-hidden="true">
            {dispositivo === 'movil' && (
              <MarcoTelefono>
                <MenuDemo nombre={nombre} dispositivo="movil" conEstado />
              </MarcoTelefono>
            )}
            {dispositivo === 'tablet' && (
              <MarcoTablet>
                <MenuDemo nombre={nombre} dispositivo="tablet" conEstado />
              </MarcoTablet>
            )}
            {dispositivo === 'pc' && (
              <MarcoPortatil url={`tuki.app/${slug(nombre)}`}>
                <MenuDemo nombre={nombre} dispositivo="pc" />
              </MarcoPortatil>
            )}
          </div>
        </div>
      </Contenedor>
    </Seccion>
  );
};
