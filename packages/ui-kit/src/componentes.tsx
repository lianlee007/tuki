import React from 'react';

export const Boton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { secundario?: boolean }
> = ({ secundario, className = '', ...props }) => (
  <button
    {...props}
    className={`tuki-btn ${secundario ? 'tuki-btn-secundario' : ''} ${className}`}
  />
);

export const Entrada: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; error?: string }
> = ({ etiqueta, error, ...props }) => (
  <label className="tuki-campo">
    <span className="tuki-label">{etiqueta}</span>
    <input className="tuki-input" {...props} />
    {error ? <span style={{ color: 'var(--tuki-error)', fontSize: 12 }}>{error}</span> : null}
  </label>
);

export const Tarjeta: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <section className={`tuki-card ${className}`}>{children}</section>;

export const Etiqueta: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="tuki-chip">{children}</span>
);

export const Cargando: React.FC<{ texto?: string }> = ({ texto = 'Cargando…' }) => (
  <p style={{ color: 'var(--tuki-texto-suave)' }}>{texto}</p>
);

export const MensajeError: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="tuki-error">{children}</p>
);

export const Cabecera: React.FC<{
  titulo?: string;
  children?: React.ReactNode;
}> = ({ titulo = 'TukiTuki', children }) => (
  <header className="tuki-header">
    <div className="tuki-marca">
      <span aria-hidden="true">
        <svg width="28" height="28" viewBox="8.5 6.5 47 47" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 32.5 C27 30.5 24 26 24.5 21 C25 17 27 14 29.5 11.5 C29 14.5 30 16.5 31.5 17.5 C32 14 32 11 33 8.5 C36 12.5 39.5 16.5 39 22 C38.5 27 35.5 30.5 34 32.5 C32.7 33.5 31.3 33.5 30 32.5 Z" />
          <rect x="12" y="32.5" width="40" height="7" rx="3.5" />
          <rect x="18" y="39.5" width="6" height="12" rx="2" />
          <rect x="40" y="39.5" width="6" height="12" rx="2" />
        </svg>
      </span>
      {titulo}
    </div>
    <div className="tuki-fila">{children}</div>
  </header>
);

export const Diseno: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="tuki-app">{children}</div>
);
