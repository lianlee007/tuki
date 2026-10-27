import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Hoja } from './Hoja';

/* -------------------------------------------------------------------------- */
/*  Pedir cuenta                                                              */
/* -------------------------------------------------------------------------- */
interface AvisoCuentaProps {
  abierto: boolean;
  onCerrar: () => void;
  /** Ruta interna a la que volver después de entrar. */
  volver: string;
  /** La cuenta abierta es de restaurante: el carrito es de comensales. */
  esRestaurante?: boolean;
  onCambiarCuenta?: () => void;
}

export const AvisoCuenta: React.FC<AvisoCuentaProps> = ({
  abierto,
  onCerrar,
  volver,
  esRestaurante = false,
  onCambiarCuenta,
}) => {
  const destino = encodeURIComponent(volver);

  return (
    <Hoja abierto={abierto} onCerrar={onCerrar} tituloId="titulo-aviso-cuenta">
      <div className="flex items-start justify-between gap-4">
        <h2 id="titulo-aviso-cuenta" className="text-[20px] font-semibold tracking-tight text-af-ink">
          {esRestaurante ? 'Tu cuenta es de restaurante' : 'Entra para pedir'}
        </h2>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="af-pulsar -mr-1 rounded-full bg-af-surface p-2 text-af-ink-secondary transition-colors hover:text-af-ink"
        >
          <X size={18} />
        </button>
      </div>

      <p className="mt-3 text-[15px] leading-relaxed text-af-ink-secondary">
        {esRestaurante
          ? 'El carrito es para comensales. Si quieres pedir, entra con una cuenta de cliente.'
          : 'Tu carrito y tus pedidos se guardan en tu cuenta. Explorar es libre; pedir necesita una.'}
      </p>

      {esRestaurante ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={onCambiarCuenta}
            className="af-pulsar w-full rounded-full bg-af-ink px-5 py-3 text-[15px] font-semibold text-af-ground transition-opacity hover:opacity-90"
          >
            Cambiar de cuenta
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          <Link
            to={`/entrar?volver=${destino}`}
            className="af-pulsar flex w-full items-center justify-center rounded-full bg-af-ink px-5 py-3 text-[15px] font-semibold text-af-ground transition-opacity hover:opacity-90"
          >
            Entrar
          </Link>
          <Link
            to={`/entrar?modo=registro&volver=${destino}`}
            className="af-pulsar flex w-full items-center justify-center rounded-full bg-af-surface px-5 py-3 text-[15px] font-semibold text-af-ink transition-colors hover:text-af-accent-text"
          >
            Crear una cuenta
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={onCerrar}
        className="mt-3 w-full py-2 text-[14px] font-semibold text-af-ink-secondary transition-colors hover:text-af-ink"
      >
        Ahora no
      </button>
    </Hoja>
  );
};

/* -------------------------------------------------------------------------- */
/*  Un carrito, un restaurante                                                */
/* -------------------------------------------------------------------------- */
interface AvisoOtroRestauranteProps {
  abierto: boolean;
  /** Restaurante del carrito actual. */
  actual?: string;
  /** Restaurante del plato que se intenta agregar. */
  nuevo: string;
  onConfirmar: () => void;
  onCerrar: () => void;
}

export const AvisoOtroRestaurante: React.FC<AvisoOtroRestauranteProps> = ({
  abierto,
  actual,
  nuevo,
  onConfirmar,
  onCerrar,
}) => (
  <Hoja abierto={abierto} onCerrar={onCerrar} tituloId="titulo-aviso-restaurante">
    <div className="flex items-start justify-between gap-4">
      <h2 id="titulo-aviso-restaurante" className="text-[20px] font-semibold tracking-tight text-af-ink">
        Tu carrito es de {actual ?? 'otro restaurante'}
      </h2>
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar"
        className="af-pulsar -mr-1 rounded-full bg-af-surface p-2 text-af-ink-secondary transition-colors hover:text-af-ink"
      >
        <X size={18} />
      </button>
    </div>

    <p className="mt-3 text-[15px] leading-relaxed text-af-ink-secondary">
      Al agregar este plato de {nuevo} empezarás un carrito nuevo. El anterior se vacía.
    </p>

    <div className="mt-6 flex flex-col gap-2">
      <button
        type="button"
        onClick={onConfirmar}
        className="af-pulsar w-full rounded-full bg-af-ink px-5 py-3 text-[15px] font-semibold text-af-ground transition-opacity hover:opacity-90"
      >
        Empezar de nuevo
      </button>
      <button
        type="button"
        onClick={onCerrar}
        className="af-pulsar w-full rounded-full bg-af-surface px-5 py-3 text-[15px] font-semibold text-af-ink transition-colors hover:text-af-accent-text"
      >
        Cancelar
      </button>
    </div>
  </Hoja>
);
