import React, { forwardRef } from 'react';
import { Save } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  prefix?: string;
  estadoGuardado?: 'cargando' | 'exito' | null;
  error?: boolean;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, icon, prefix, estadoGuardado, error, helper, className = '', ...props }, ref) => {
  /* El hueco de la izquierda lo ocupan el icono y/o el prefijo. Se calcula el
     ancho real de cada uno —no a ojo— porque antes «+57» se montaba encima del
     icono y del número. */
  let paddingLeftClass = '';
  if (icon && prefix) paddingLeftClass = '!pl-[4.5rem]'; // icono (16+12) + «+57» + aire
  else if (prefix) paddingLeftClass = '!pl-12';
  else if (icon) paddingLeftClass = '!pl-10';

  return (
    <div className="w-full relative group">
      {label && (
        <label className="block text-xs font-semibold text-af-ink-secondary mb-1.5 ml-0.5 uppercase tracking-tighter">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute top-1/2 left-3 -translate-y-1/2 text-af-ink-secondary pointer-events-none z-10 group-focus-within:text-af-accent transition-colors">
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
          className={`input-af w-full !pr-10 ${paddingLeftClass} ${error ? 'border-af-danger focus:border-af-danger' : ''} ${className}`}
          {...props}
        />

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
        <p className="mt-1.5 text-xs text-af-danger font-medium">{helper}</p>
      )}
      {!error && helper && (
        <p className="mt-1.5 text-xs text-af-ink-secondary">{helper}</p>
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

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, estadoGuardado, error, helper, className = '', ...props }, ref) => (
  <div className="w-full relative group">
    {label && (
      <label className="block text-xs font-semibold text-af-ink-secondary mb-1.5 ml-0.5 uppercase tracking-tighter">
        {label}
      </label>
    )}
    <div className="relative">
      <textarea
        ref={ref}
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
      <p className="mt-1.5 text-xs text-af-danger font-medium">{helper}</p>
    )}
    {!error && helper && (
      <p className="mt-1.5 text-xs text-af-ink-secondary">{helper}</p>
    )}
  </div>
));

Textarea.displayName = 'Textarea';
