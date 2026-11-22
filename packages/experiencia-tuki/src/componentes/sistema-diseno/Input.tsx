import React, { forwardRef, useId } from 'react';
import { Save } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  prefix?: string;
  /** Acción a la derecha del campo, como mostrar u ocultar la contraseña. */
  accion?: React.ReactNode;
  estadoGuardado?: 'cargando' | 'exito' | null;
  error?: boolean;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, icon, prefix, accion, estadoGuardado, error, helper, className = '', id, 'aria-describedby': descritoPor, 'aria-invalid': ariaInvalido, ...props }, ref) => {
  /* El hueco de la izquierda lo ocupan el icono y/o el prefijo. Se calcula el
     ancho real de cada uno —no a ojo— porque antes «+57» se montaba encima del
     icono y del número. */
  let paddingLeftClass = '';
  if (icon && prefix) paddingLeftClass = '!pl-[4.5rem]'; // icono (16+12) + «+57» + aire
  else if (prefix) paddingLeftClass = '!pl-12';
  else if (icon) paddingLeftClass = '!pl-10';

  /* Sin `for`, pulsar la etiqueta no enfoca el campo y el lector de pantalla no
     lo anuncia con su nombre. Si quien usa el componente no da un id estable,
     se genera uno por instancia. */
  const idGenerado = useId();
  const campoId = id ?? idGenerado;
  const ayudaId = `${campoId}-ayuda`;
  const descrito = [descritoPor, helper ? ayudaId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="w-full relative group">
      {label && (
        <label
          htmlFor={campoId}
          className="mb-1.5 ml-0.5 block text-xs font-semibold text-af-ink-secondary"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute top-1/2 left-3 z-10 -translate-y-1/2 text-af-ink-secondary pointer-events-none group-focus-within:text-af-accent transition-colors">
            {icon}
          </div>
        )}
        {prefix && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 text-af-ink font-medium pointer-events-none z-10 pr-2 flex items-center h-[20px] ${icon ? 'left-9' : 'left-4'}`}
          >
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          id={campoId}
          aria-describedby={descrito}
          aria-invalid={ariaInvalido ?? (error ? true : undefined)}
          className={`input-af w-full ${accion ? '!pr-12' : '!pr-10'} ${paddingLeftClass} ${error ? 'border-af-danger focus:border-af-danger' : ''} ${className}`}
          {...props}
        />

        {accion && (
          <div className="absolute right-1.5 top-1/2 z-20 -translate-y-1/2">{accion}</div>
        )}

        {estadoGuardado && (
          <div className="absolute right-3 top-0 bottom-0 my-auto h-4 w-4 flex items-center justify-center z-20 pointer-events-none">
            {estadoGuardado === 'cargando' ? (
              <div className="w-4 h-4 border-2 border-af-accent border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <div className="text-af-success flex items-center justify-center animate-fade-in-af duration-300">
                <Save size={16} />
              </div>
            )}
          </div>
        )}
      </div>
      {error && helper && (
        <p id={ayudaId} className="mt-1.5 text-xs text-af-danger font-medium">{helper}</p>
      )}
      {!error && helper && (
        <p id={ayudaId} className="mt-1.5 text-xs text-af-ink-secondary">{helper}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  estadoGuardado?: 'cargando' | 'exito' | null;
  error?: boolean;
  helper?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, estadoGuardado, error, helper, className = '', id, 'aria-describedby': descritoPor, 'aria-invalid': ariaInvalido, ...props }, ref) => {
  const idGenerado = useId();
  const campoId = id ?? idGenerado;
  const ayudaId = `${campoId}-ayuda`;
  const descrito = [descritoPor, helper ? ayudaId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="w-full relative group">
      {label && (
        <label
          htmlFor={campoId}
          className="mb-1.5 ml-0.5 block text-xs font-semibold text-af-ink-secondary"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          ref={ref}
          id={campoId}
          aria-describedby={descrito}
          aria-invalid={ariaInvalido ?? (error ? true : undefined)}
          className={`input-af w-full px-4 py-3 min-h-[110px] pr-10 ${error ? 'border-af-danger focus:border-af-danger' : ''} ${className}`}
          {...props}
        />
        {estadoGuardado && (
          <div className="absolute right-3 bottom-3 animate-fade-in-af z-20 pointer-events-none">
            {estadoGuardado === 'cargando' ? (
              <div className="w-4 h-4 border-2 border-af-accent border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <div className="text-af-success flex items-center justify-center animate-fade-in-af duration-300">
                <Save size={16} />
              </div>
            )}
          </div>
        )}
      </div>
      {error && helper && (
        <p id={ayudaId} className="mt-1.5 text-xs text-af-danger font-medium">{helper}</p>
      )}
      {!error && helper && (
        <p id={ayudaId} className="mt-1.5 text-xs text-af-ink-secondary">{helper}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
