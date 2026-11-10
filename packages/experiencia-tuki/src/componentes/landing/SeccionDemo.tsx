import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone, Store, Tablet } from 'lucide-react';
import { Contenedor, Seccion } from '../ui';
import { EncabezadoSeccion } from './EncabezadoSeccion';
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
 * La dirección en vivo debajo del campo es la otra mitad de esa idea: no
 * promete «tu web», la enseña escrita con su nombre. Y el selector va pegado a
 * la caja de texto, como la barra de una ventana: un solo control, no dos
 * bloques que hay que emparejar con la vista.
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
    <Seccion id="ejemplos" padding="mediano" className="hidden !py-20 lg:block">
      <Contenedor maxAncho="grande">
        <EncabezadoSeccion
          titulo="Míralo en la pantalla de tus clientes"
          descripcion="Escribe el nombre de tu restaurante y cámbialo de aparato."
        />

        <div className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-5 sm:flex-row sm:items-start sm:justify-center">
          <div className="w-full sm:max-w-sm">
            <label
              htmlFor="demo-nombre"
              className="block text-[12px] font-semibold text-af-ink-secondary"
            >
              Nombre de tu restaurante
            </label>
            <div className="mt-2 flex h-12 items-center gap-2.5 rounded-xl border border-af-border/80 bg-af-ground px-3.5 transition-colors focus-within:border-af-accent/70 focus-within:ring-2 focus-within:ring-af-accent/20">
              <Store size={16} className="shrink-0 text-af-ink-secondary" aria-hidden="true" />
              <input
                id="demo-nombre"
                type="text"
                className="h-full w-full min-w-0 bg-transparent text-[15px] font-medium text-af-ink outline-none placeholder:text-af-ink-secondary/70"
                placeholder="El Fogón de Marta"
                value={nombre}
                maxLength={28}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <p className="mt-2 truncate text-xs text-af-ink-secondary">
              tukituki.app/
              <span className="font-semibold text-af-accent-text">{slug(nombre)}</span>
            </p>
          </div>

          <div
            className="hidden shrink-0 items-center gap-1 rounded-xl bg-af-surface/80 p-1 ring-1 ring-af-border/60 lg:mt-[1.55rem] lg:flex dark:bg-hearth-night-card dark:ring-white/10"
            role="group"
            aria-label="Elegir tamaño de pantalla"
          >
            {APARATOS.map(({ id, etiqueta, icono: Icono }) => {
              const activo = dispositivo === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDispositivo(id)}
                  aria-pressed={activo}
                  className={`af-pulsar flex h-9 items-center gap-2 rounded-lg px-3.5 text-[13px] font-semibold transition-colors ${
                    activo
                      ? 'bg-hearth-card text-af-ink shadow-warm dark:bg-hearth-night-oat dark:text-hearth-night-ink'
                      : 'text-af-ink-secondary hover:text-af-ink'
                  }`}
                >
                  <Icono size={15} strokeWidth={2} aria-hidden="true" />
                  {etiqueta}
                </button>
              );
            })}
          </div>
        </div>

        {/* La clave del cambio de aparato hace que la vista entre con un fundido
            corto. El marco cambia de tamaño en el acto —es un objeto, no un
            contenedor que se estira— y el fundido tapa el salto. */}
        <div className="relative mt-12 flex justify-center py-4 lg:py-8">
          <div
            aria-hidden="true"
            className="af-escenario absolute inset-x-4 top-6 bottom-6 hidden rounded-[3rem] lg:block"
          />
          <div key={dispositivo} className="af-entrada-velo relative z-10" aria-hidden="true">
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
              <MarcoPortatil url={`tukituki.app/${slug(nombre)}`}>
                <MenuDemo nombre={nombre} dispositivo="pc" />
              </MarcoPortatil>
            )}
          </div>
        </div>
      </Contenedor>
    </Seccion>
  );
};
