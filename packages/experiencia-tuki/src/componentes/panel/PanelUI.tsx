import React from 'react';
import { Check, CircleDashed } from 'lucide-react';

/**
 * Piezas compartidas del panel.
 *
 * El panel mezcla formularios largos, listas y estados vacíos. Estas piezas
 * fijan una sola jerarquía (eyebrow, título, descripción, tarjeta con cabecera)
 * para que cada apartado se lea igual en móvil y en escritorio, sin repetir
 * clases en cada sección.
 */

interface CabeceraSeccionProps {
  /** Etiqueta corta en versalitas: ubica al dueño dentro del panel. */
  eyebrow?: string;
  titulo: string;
  descripcion?: string;
  /** Acciones a la derecha (guardar, crear, filtros). */
  acciones?: React.ReactNode;
}

export const CabeceraSeccion: React.FC<CabeceraSeccionProps> = ({
  eyebrow,
  titulo,
  descripcion,
  acciones,
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && (
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-af-accent-text">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-1 text-balance text-[22px] font-bold leading-tight tracking-[-0.015em] text-af-ink md:text-[26px]">
        {titulo}
      </h2>
      {descripcion && (
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-af-ink-secondary">
          {descripcion}
        </p>
      )}
    </div>
    {acciones && <div className="flex shrink-0 flex-wrap items-center gap-2">{acciones}</div>}
  </div>
);

interface TarjetaSeccionProps {
  id?: string;
  icono?: React.ReactNode;
  titulo?: string;
  descripcion?: string;
  acciones?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Quita el relleno interior para tablas y listas a sangre. */
  sinRelleno?: boolean;
  /** Deja que un desplegable salga de la tarjeta (filtros, buscadores). */
  desborde?: boolean;
}

export const TarjetaSeccion: React.FC<TarjetaSeccionProps> = ({
  id,
  icono,
  titulo,
  descripcion,
  acciones,
  children,
  className = '',
  sinRelleno = false,
  desborde = false,
}) => (
  <section id={id} className={`scroll-mt-24 ${className}`}>
    <div className={`card-af border border-af/10 !p-0 ${desborde ? '' : 'overflow-hidden'}`}>
      {titulo && (
        <header className="flex flex-wrap items-start gap-3 border-b border-af/10 px-4 py-4 md:px-6 md:py-5">
          {icono && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-af-accent/10 text-af-accent-text">
              {icono}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold leading-tight text-af-ink">{titulo}</h3>
            {descripcion && (
              <p className="mt-1 text-xs leading-relaxed text-af-ink-secondary">{descripcion}</p>
            )}
          </div>
          {acciones && <div className="ml-auto flex shrink-0 items-center gap-2">{acciones}</div>}
        </header>
      )}
      <div className={sinRelleno ? '' : 'px-4 py-5 md:px-6 md:py-6'}>{children}</div>
    </div>
  </section>
);

export const Chip: React.FC<{
  children: React.ReactNode;
  tono?: 'neutro' | 'exito' | 'alerta' | 'marca';
  icono?: React.ReactNode;
  className?: string;
}> = ({ children, tono = 'neutro', icono, className = '' }) => {
  const tonos = {
    neutro: 'bg-af-ink/[0.06] text-af-ink-secondary',
    exito: 'bg-af-success/10 text-af-success',
    alerta: 'bg-af-danger/10 text-af-danger-text',
    marca: 'bg-af-accent/10 text-af-accent-text',
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tonos[tono]} ${className}`}
    >
      {icono}
      {children}
    </span>
  );
};

export const AnilloProgreso: React.FC<{
  valor: number;
  tamano?: number;
  etiqueta?: string;
}> = ({ valor, tamano = 72, etiqueta }) => {
  const pct = Math.max(0, Math.min(100, Math.round(valor)));
  const radio = (tamano - 8) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const completo = pct === 100;
  return (
    <div
      className="relative shrink-0"
      style={{ width: tamano, height: tamano }}
      role="img"
      aria-label={etiqueta ?? `${pct}% completado`}
    >
      <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} aria-hidden="true">
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-af-ink/10"
        />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - pct / 100)}
          transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
          className={completo ? 'text-af-success' : 'text-af-accent-solid'}
          style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-bold tabular-nums leading-none text-af-ink">{pct}%</span>
      </span>
    </div>
  );
};

export const EstadoVacio: React.FC<{
  icono: React.ReactNode;
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
}> = ({ icono, titulo, descripcion, accion }) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-af-accent/10 text-af-accent-text">
      {icono}
    </span>
    <h4 className="mt-4 text-[15px] font-bold text-af-ink">{titulo}</h4>
    {descripcion && (
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-af-ink-secondary">
        {descripcion}
      </p>
    )}
    {accion && <div className="mt-5">{accion}</div>}
  </div>
);

/** Fila de dato para resúmenes y vistas previas. */
export const FilaDato: React.FC<{
  icono?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ icono, children, className = '' }) => (
  <div className={`flex items-start gap-2 text-[12.5px] leading-snug text-af-ink-secondary ${className}`}>
    {icono && <span className="mt-0.5 shrink-0 text-af-ink-secondary/80">{icono}</span>}
    <span className="min-w-0">{children}</span>
  </div>
);

export const MarcaCompleto: React.FC<{ completo: boolean; children?: React.ReactNode }> = ({
  completo,
  children,
}) =>
  completo ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-af-success">
      <Check size={13} strokeWidth={3} aria-hidden="true" />
      {children ?? 'Completo'}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-af-danger-text">
      <CircleDashed size={13} strokeWidth={2.4} aria-hidden="true" />
      {children ?? 'Pendiente'}
    </span>
  );
