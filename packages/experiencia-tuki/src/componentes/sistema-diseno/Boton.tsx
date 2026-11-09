import React from 'react';
import { Loader2, ArrowRight } from 'lucide-react';

interface BotonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'peligro' | 'fantasma';
  tamanio?: 'pequeno' | 'mediano' | 'grande';
  cargando?: boolean;
  icono?: React.ReactNode;
  anchoCompleto?: boolean;
}

export const Boton: React.FC<BotonProps> = ({
  children,
  variante = 'primario',
  tamanio = 'mediano',
  className = '',
  cargando,
  icono,
  onClick,
  anchoCompleto = false,
  type = 'button',
  disabled,
  ...props
}) => {
  const base = "btn-af rounded-xl font-medium transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none";
  const sizeMap = {
    pequeno: "px-4 py-2 text-xs",
    mediano: "px-6 py-3 text-sm",
    grande: "px-8 py-4 text-base",
  };
  const variantMap: Record<string, string> = {
    primario: "btn-af",
    secundario: "btn-af-secondary",
    peligro: "btn-af-danger",
    fantasma: "btn-af-ghost",
  };

  const classes = `${base} ${variantMap[variante]} ${sizeMap[tamanio]} ${anchoCompleto ? 'w-full' : ''} ${className}`;

  return (
    // `{...props}` va primero: si se esparce al final pisaría `disabled`, y un
    // botón con `cargando` volvería a quedar pulsable durante la petición.
    <button
      {...props}
      type={type}
      className={classes}
      disabled={cargando || disabled}
      onClick={onClick}
    >
      {cargando ? <Loader2 className="animate-spin h-4 w-4" /> : icono}
      {children}
    </button>
  );
};

/* Extiende los atributos nativos del botón: sin esto, `onClick`, `className`
   o `type` no existían en el tipo y cada uso del botón daba un error de
   compilación (aunque en tiempo de ejecución sí se reenviaban). */
interface BotonCTAProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  cargando?: boolean;
  /** `true` añade una flecha; también acepta un nodo propio. */
  iconoDerecho?: boolean | React.ReactNode;
  /** Ocupa todo el ancho disponible del contenedor. */
  anchoCompleto?: boolean;
}

/**
 * Botón de acción primaria destacada (CTA principal). Idealmente uno por pantalla.
 */
export function BotonCTA({
  children = null,
  className = '',
  onClick,
  cargando,
  iconoDerecho,
  ...props
}: BotonCTAProps) {
  const icono = iconoDerecho === true ? <ArrowRight size={18} /> : (iconoDerecho || null);
  return (
    <Boton
      variante="primario"
      tamanio="grande"
      cargando={cargando}
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
      {!cargando && icono}
    </Boton>
  );
}

/**
 * Botón secundario de texto (menos énfasis).
 */
export function BotonTexto({
  children = null,
  className = '',
  onClick,
  ...props
}: BotonCTAProps) {
  return (
    <Boton
      variante="fantasma"
      tamanio="mediano"
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
    </Boton>
  );
}
