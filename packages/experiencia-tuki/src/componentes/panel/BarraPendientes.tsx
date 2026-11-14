/**
 * Progreso de la configuración del restaurante.
 *
 * Vive en la cabecera del panel, junto al asistente de IA. La barra se llena
 * con los datos obligatorios que ya están completos y, al pulsarla, se abre un
 * resumen con lo que falta agrupado por bloque del formulario: cada dato lleva
 * al campo exacto sin tener que buscarlo. El estado lo calcula `SeccionInfo`
 * —es quien conoce el formulario— y lo publica aquí vía `onEstadoPublicacion`.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, ChevronDown, CircleDashed, X } from 'lucide-react';
import type { CampoPublicacion, EstadoPublicacion } from './SeccionInfo';

interface BarraPendientesProps {
  estado: EstadoPublicacion | null;
  visible: boolean;
}

/** Agrupa los campos por bloque del formulario, conservando su orden. */
const agrupar = (campos: CampoPublicacion[]) => {
  const grupos = new Map<string, CampoPublicacion[]>();
  campos.forEach((campo) => {
    const lista = grupos.get(campo.grupo);
    if (lista) lista.push(campo);
    else grupos.set(campo.grupo, [campo]);
  });
  return [...grupos.entries()];
};

export const BarraPendientes: React.FC<BarraPendientesProps> = ({ estado, visible }) => {
  const [abierta, setAbierta] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierta) return;
    const cerrarFuera = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierta(false);
    };
    const cerrarEscape = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAbierta(false);
    };
    document.addEventListener('mousedown', cerrarFuera);
    document.addEventListener('keydown', cerrarEscape);
    return () => {
      document.removeEventListener('mousedown', cerrarFuera);
      document.removeEventListener('keydown', cerrarEscape);
    };
  }, [abierta]);

  useEffect(() => {
    // Si se publica mientras el resumen está abierto, se cierra solo.
    if (estado?.estaPublicado) setAbierta(false);
  }, [estado?.estaPublicado]);

  if (!visible || !estado) return null;

  const pct = estado.total > 0 ? Math.round((estado.completos / estado.total) * 100) : 100;
  const faltan = estado.faltantes.length;
  const resumen = estado.estaPublicado
    ? 'Tu sitio está publicado'
    : faltan === 1
      ? 'Falta 1 dato para publicar'
      : `Faltan ${faltan} datos para publicar`;

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierta((valor) => !valor)}
        aria-expanded={abierta}
        aria-haspopup="dialog"
        aria-label={`${resumen}. ${pct}% de los datos completos.`}
        title={`${resumen} · ${pct}% completo`}
        className="flex shrink-0 items-center gap-2 rounded-full border border-af/20 bg-af-surface/70 py-1.5 pl-3 pr-2 text-xs font-semibold text-af-ink shadow-sm outline-none transition-colors duration-150 hover:border-af-accent/40 hover:bg-af-surface focus-visible:ring-2 focus-visible:ring-af-accent/40"
      >
        <span className="relative h-2 w-12 overflow-hidden rounded-full bg-af-ink/10 sm:w-20" aria-hidden>
          <span
            className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out ${
              estado.estaPublicado ? 'bg-af-success' : 'bg-af-accent-solid'
            }`}
            style={{ width: `${pct}%` }}
          />
        </span>
        <span className="tabular-nums">{pct}%</span>
        {estado.estaPublicado ? (
          <span className="hidden items-center gap-1 text-af-success sm:flex">
            <CheckCircle2 size={14} strokeWidth={2.6} aria-hidden /> Publicado
          </span>
        ) : (
          <span className="hidden tabular-nums text-af-ink-secondary sm:inline">
            {estado.completos}/{estado.total}
          </span>
        )}
        <ChevronDown
          size={14}
          aria-hidden
          className={`transition-transform duration-150 ${abierta ? 'rotate-180' : ''}`}
        />
      </button>

      {abierta && (
        <div
          role="dialog"
          aria-label="Resumen de la configuración del restaurante"
          className="fixed inset-x-3 top-[4.25rem] z-50 overflow-hidden rounded-2xl border border-af/20 bg-af-surface shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[22rem]"
        >
          <div className="border-b border-af/10 p-4 pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-bold text-af-ink">
                  {estado.estaPublicado ? (
                    <CheckCircle2 size={15} strokeWidth={2.6} className="shrink-0 text-af-success" aria-hidden />
                  ) : (
                    <CircleDashed size={15} strokeWidth={2.4} className="shrink-0 text-af-accent-text" aria-hidden />
                  )}
                  {resumen}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-af-ink-secondary">
                  {estado.estaPublicado
                    ? 'Todo lo obligatorio está completo. Puedes seguir ajustando lo que quieras.'
                    : 'Toca un dato para ir directo al campo que falta.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbierta(false)}
                aria-label="Cerrar el resumen"
                className="shrink-0 rounded-full p-1 text-af-ink-secondary outline-none transition-colors hover:bg-af-ink/10 hover:text-af-ink focus-visible:ring-2 focus-visible:ring-af-accent/40"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums leading-none text-af-ink">{pct}%</span>
              <span className="text-xs text-af-ink-secondary">
                {estado.completos} de {estado.total} datos completos
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-af-ink/10" aria-hidden>
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                  estado.estaPublicado ? 'bg-af-success' : 'bg-af-accent-solid'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="max-h-[min(60vh,23rem)] overflow-y-auto overscroll-contain p-2">
            {agrupar(estado.faltantes).map(([grupo, campos]) => (
              <div key={grupo} className="mb-1.5 last:mb-0">
                <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-af-ink-secondary">
                  {grupo}
                </p>
                <ul>
                  {campos.map((campo) => (
                    <li key={campo.k}>
                      <button
                        type="button"
                        onClick={() => {
                          setAbierta(false);
                          estado.irA(campo.k);
                        }}
                        className="group flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left outline-none transition-colors duration-150 hover:bg-af-accent/10 focus-visible:bg-af-accent/10 focus-visible:ring-2 focus-visible:ring-af-accent/40"
                      >
                        <CircleDashed
                          size={13}
                          strokeWidth={2.4}
                          className="shrink-0 text-af-danger-text"
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-af-ink">
                          {campo.l}
                        </span>
                        <span className="shrink-0 text-[11px] font-medium text-af-accent-text opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          Completar
                        </span>
                        <ArrowRight
                          size={13}
                          className="shrink-0 text-af-ink-secondary opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                          aria-hidden
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {estado.listos.length > 0 && (
              <details className="group mt-1 border-t border-af/10 pt-1">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-af-ink-secondary outline-none transition-colors hover:text-af-ink focus-visible:ring-2 focus-visible:ring-af-accent/40 [&::-webkit-details-marker]:hidden">
                  <ChevronDown
                    size={12}
                    aria-hidden
                    className="transition-transform duration-150 group-open:rotate-180"
                  />
                  Lo que ya está listo ({estado.listos.length})
                </summary>
                <div className="flex flex-wrap gap-1.5 px-1 pb-1 pt-1">
                  {estado.listos.map((campo) => (
                    <span
                      key={campo.k}
                      className="inline-flex items-center gap-1 rounded-full bg-af-success/10 px-2 py-0.5 text-[11px] font-medium text-af-success"
                    >
                      <Check size={11} strokeWidth={3} aria-hidden /> {campo.l}
                    </span>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
