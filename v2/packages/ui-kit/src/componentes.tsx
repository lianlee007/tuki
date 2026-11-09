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
      <span>T</span>
      {titulo}
    </div>
    <div className="tuki-fila">{children}</div>
  </header>
);

export const Diseno: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="tuki-app">{children}</div>
);
