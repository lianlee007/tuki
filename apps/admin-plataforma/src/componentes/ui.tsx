import React, { useEffect, useRef } from 'react';
import type { Tema } from '../hooks/useTema';
import {
  IconoAlerta,
  IconoBuscar,
  IconoCerrar,
  IconoCheck,
  IconoEscudo,
  IconoLuna,
  IconoSol,
} from './iconos';

export const SimboloTuki = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="8.5 6.5 47 47"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M30 32.5 C27 30.5 24 26 24.5 21 C25 17 27 14 29.5 11.5 C29 14.5 30 16.5 31.5 17.5 C32 14 32 11 33 8.5 C36 12.5 39.5 16.5 39 22 C38.5 27 35.5 30.5 34 32.5 C32.7 33.5 31.3 33.5 30 32.5 Z" />
    <rect x="12" y="32.5" width="40" height="7" rx="3.5" />
    <rect x="18" y="39.5" width="6" height="12" rx="2" />
    <rect x="40" y="39.5" width="6" height="12" rx="2" />
  </svg>
);

export const Marca = ({ compacta = false }: { compacta?: boolean }) => (
  <span className="admin-marca" translate="no">
    <span className="admin-marca-simbolo">
      <SimboloTuki size={26} />
    </span>
    <span className="admin-marca-texto">
      <span className="admin-marca-nombre">TukiTuki</span>
      {!compacta ? <span className="admin-marca-etiqueta">Consola</span> : null}
    </span>
  </span>
);

export const BotonIcono = ({
  etiqueta,
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  etiqueta: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    {...props}
    aria-label={etiqueta}
    title={etiqueta}
    className={`admin-boton-icono ${className}`}
  >
    {children}
  </button>
);

export const BotonTema = ({
  tema,
  alternar,
}: {
  tema: Tema;
  alternar: () => void;
}) => (
  <BotonIcono
    etiqueta={tema === 'dark' ? 'Activar el tema claro' : 'Activar el tema oscuro'}
    onClick={alternar}
  >
    {tema === 'dark' ? <IconoSol size={18} /> : <IconoLuna size={18} />}
  </BotonIcono>
);

export const Avatar = ({
  nombre,
  apellido = '',
  tono = 'primario',
}: {
  nombre: string;
  apellido?: string;
  tono?: 'primario' | 'miel' | 'salvia';
}) => {
  const inicial = `${nombre.trim().charAt(0)}${apellido.trim().charAt(0)}`.toUpperCase() || '·';
  return (
    <span className={`admin-avatar admin-avatar-${tono}`} aria-hidden="true">
      {inicial}
    </span>
  );
};

export const EtiquetaEstado = ({
  activo,
  activoTexto = 'Activo',
  inactivoTexto = 'Suspendido',
}: {
  activo: boolean;
  activoTexto?: string;
  inactivoTexto?: string;
}) => (
  <span className={`admin-pill ${activo ? 'admin-pill-exito' : 'admin-pill-peligro'}`}>
    <span className="admin-pill-punto" aria-hidden="true" />
    {activo ? activoTexto : inactivoTexto}
  </span>
);

export const Buscador = ({
  valor,
  onCambio,
  placeholder,
  etiqueta,
  inputRef,
  atajo = false,
}: {
  valor: string;
  onCambio: (texto: string) => void;
  placeholder: string;
  etiqueta: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  atajo?: boolean;
}) => (
  <div className="admin-buscador">
    <IconoBuscar size={17} className="admin-buscador-icono" />
    <input
      ref={inputRef}
      type="text"
      inputMode="search"
      enterKeyHint="search"
      value={valor}
      onChange={(evento) => onCambio(evento.target.value)}
      placeholder={placeholder}
      aria-label={etiqueta}
      autoComplete="off"
      spellCheck={false}
      aria-keyshortcuts={atajo ? '/' : undefined}
      className="admin-buscador-input"
    />
    {valor ? (
      <BotonIcono
        etiqueta="Limpiar la búsqueda"
        className="admin-buscador-limpiar"
        onClick={() => onCambio('')}
      >
        <IconoCerrar size={15} />
      </BotonIcono>
    ) : atajo ? (
      <kbd className="admin-atajo" aria-hidden="true">
        /
      </kbd>
    ) : null}
  </div>
);

export const EstadoVacio = ({
  icono,
  titulo,
  descripcion,
  accion,
}: {
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
  accion?: React.ReactNode;
}) => (
  <div className="admin-vacio">
    <span className="admin-vacio-icono">{icono}</span>
    <h3>{titulo}</h3>
    <p>{descripcion}</p>
    {accion}
  </div>
);

export const Aviso = ({
  tipo,
  texto,
  onCerrar,
}: {
  tipo: 'exito' | 'error';
  texto: string;
  onCerrar: () => void;
}) => {
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  useEffect(() => {
    const temporizador = window.setTimeout(() => cerrar.current(), 4600);
    return () => window.clearTimeout(temporizador);
  }, []);

  return (
    <div className={`admin-aviso admin-aviso-${tipo}`} role="status" aria-live="polite">
      <span className="admin-aviso-icono">
        {tipo === 'exito' ? <IconoCheck size={17} /> : <IconoAlerta size={17} />}
      </span>
      <p>{texto}</p>
      <BotonIcono etiqueta="Cerrar el aviso" onClick={onCerrar} className="admin-aviso-cerrar">
        <IconoCerrar size={15} />
      </BotonIcono>
    </div>
  );
};

export const ModalConfirmacion = ({
  abierto,
  titulo,
  descripcion,
  textoConfirmar,
  peligro = false,
  procesando = false,
  onConfirmar,
  onCerrar,
  children,
}: {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  textoConfirmar: string;
  peligro?: boolean;
  procesando?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
  children?: React.ReactNode;
}) => {
  const dialogo = useRef<HTMLDivElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  useEffect(() => {
    if (!abierto) return;
    const enfocado = document.activeElement as HTMLElement | null;
    const desborde = document.body.style.overflow;
    const temporizador = window.setTimeout(() => cancelar.current?.focus(), 20);
    document.body.style.overflow = 'hidden';

    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape' && !procesando) {
        evento.preventDefault();
        cerrar.current();
        return;
      }
      if (evento.key !== 'Tab' || !dialogo.current) return;

      const elementos = Array.from(
        dialogo.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((elemento) => elemento.offsetParent !== null);
      if (elementos.length === 0) return;

      const primero = elementos[0];
      const ultimo = elementos[elementos.length - 1];
      if (!primero || !ultimo) return;

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener('keydown', alPulsar);
    return () => {
      window.clearTimeout(temporizador);
      document.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = desborde;
      enfocado?.focus();
    };
  }, [abierto, procesando]);

  if (!abierto) return null;

  return (
    <div
      className="admin-modal-fondo"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !procesando) onCerrar();
      }}
    >
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-titulo"
        aria-describedby="admin-modal-descripcion"
        className="admin-modal"
      >
        <span className={`admin-modal-icono ${peligro ? 'admin-modal-icono-peligro' : ''}`}>
          {peligro ? <IconoAlerta size={22} /> : <IconoEscudo size={22} />}
        </span>
        <h2 id="admin-modal-titulo">{titulo}</h2>
        <p id="admin-modal-descripcion">{descripcion}</p>
        {children}
        <div className="admin-modal-acciones">
          <button
            ref={cancelar}
            type="button"
            className="admin-btn admin-btn-secundario"
            onClick={onCerrar}
            disabled={procesando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`admin-btn ${peligro ? 'admin-btn-peligro' : 'admin-btn-primario'}`}
            onClick={onConfirmar}
            disabled={procesando}
          >
            {procesando ? 'Aplicando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};

export const EsqueletoPanel = () => (
  <div aria-busy="true" aria-label="Cargando el panel">
    <div className="admin-metricas">
      {[0, 1, 2, 3].map((indice) => (
        <div key={indice} className="admin-metrica admin-esqueleto-caja" />
      ))}
    </div>
    <div className="admin-esqueleto-bloque" />
    <div className="admin-esqueleto-bloque admin-esqueleto-bloque-alto" />
  </div>
);

export const CargandoPantalla = () => (
  <div className="admin-pantalla-carga">
    <span className="admin-spinner" aria-hidden="true" />
    <p>Cargando la consola…</p>
  </div>
);
