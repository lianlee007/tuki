/**
 * Barra de acciones pendientes de la configuración del restaurante.
 *
 * Vive en la cabecera del panel, junto al asistente de IA, para que el dueño
 * vea lo que falta y salte al campo sin tener que bajar hasta el formulario.
 * El estado lo calcula `SeccionInfo` —es quien conoce el formulario— y lo
 * publica aquí mediante `onEstadoPublicacion`.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AlertOctagon, CheckCircle2, ChevronDown, X } from 'lucide-react';
import type { EstadoPublicacion } from './SeccionInfo';

interface BarraPendientesProps {
  estado: EstadoPublicacion | null;
  visible: boolean;
}

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
    // Si se publica mientras el desplegable está abierto, se cierra solo.
    if (estado?.estaPublicado) setAbierta(false);
  }, [estado?.estaPublicado]);

  if (!visible || !estado) return null;

  if (estado.estaPublicado) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-af-success/10 px-2.5 py-1.5 text-xs font-semibold text-af-success">
        <CheckCircle2 size={14} strokeWidth={2.6} aria-hidden />
        <span className="hidden sm:inline">Publicado</span>
      </span>
    );
  }

  const faltantes = estado.faltantes;

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierta((valor) => !valor)}
        aria-expanded={abierta}
        aria-haspopup="dialog"
        title={`${faltantes.length} campos pendientes`}
        className="flex items-center gap-1.5 rounded-full bg-af-danger/10 px-2.5 py-1.5 text-xs font-semibold text-af-danger-text transition-colors duration-150 outline-none hover:bg-af-danger/20 focus-visible:ring-2 focus-visible:ring-af-danger/40"
      >
        <AlertOctagon size={14} strokeWidth={2.4} aria-hidden />
        <span className="tabular-nums">{faltantes.length}</span>
        <span className="hidden sm:inline">pendientes</span>
        <ChevronDown
          size={14}
          aria-hidden
          className={`transition-transform duration-150 ${abierta ? 'rotate-180' : ''}`}
        />
      </button>

      {abierta && (
        <div
          role="dialog"
          aria-label="Campos pendientes de la configuración"
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-af/20 bg-af-surface p-3 shadow-xl"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-af-ink">Tu sitio aún no está publicado</p>
              <p className="mt-0.5 text-xs leading-snug text-af-ink-secondary">
                Completa los campos marcados para que tus clientes puedan entrar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAbierta(false)}
              aria-label="Cerrar pendientes"
              className="shrink-0 rounded-full p-1 text-af-ink-secondary outline-none transition-colors hover:bg-af-ink/10 hover:text-af-ink"
            >
              <X size={15} />
            </button>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-af-ink/10">
              <div
                className="h-full rounded-full bg-af-accent transition-transform duration-300 ease-out"
                style={{
                  transform: `scaleX(${estado.completos / estado.total})`,
                  transformOrigin: 'left',
                }}
              />
            </div>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-af-ink-secondary">
              {estado.completos}/{estado.total}
            </span>
          </div>

          <div className="flex max-h-60 flex-wrap gap-1.5 overflow-y-auto">
            {faltantes.map((campo) => (
              <button
                key={campo.k}
                type="button"
                onClick={() => {
                  setAbierta(false);
                  estado.irA(campo.k);
                }}
                className="rounded-full bg-af-danger/10 px-2.5 py-1 text-xs font-semibold text-af-danger-text outline-none transition-colors duration-150 hover:bg-af-danger/20 focus-visible:ring-2 focus-visible:ring-af-danger/40"
              >
                {campo.l}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
