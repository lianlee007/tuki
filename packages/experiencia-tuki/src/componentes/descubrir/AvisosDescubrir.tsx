import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Hoja } from './Hoja';
import { ETIQUETA, FOCO } from './estilos';

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

const BOTON_PRIMARIO = `af-pulsar flex w-full items-center justify-center rounded-xl bg-hearth-terracotta-deep px-5 py-3 text-[14px] font-extrabold text-white shadow-warm transition-colors hover:bg-hearth-terracotta-ink dark:bg-hearth-night-terracotta dark:text-hearth-night dark:hover:bg-[#F6A184] ${FOCO}`;
const BOTON_SUAVE = `af-pulsar flex w-full items-center justify-center rounded-xl bg-hearth-oat px-5 py-3 text-[14px] font-bold text-hearth-espresso transition-colors hover:bg-hearth-oat-deep dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:hover:bg-hearth-night-line ${FOCO}`;

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
        <div>
          <p className={`${ETIQUETA} text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink`}>
            Un paso más
          </p>
          <h2
            id="titulo-aviso-cuenta"
            className="mt-1 font-jakarta text-xl font-extrabold tracking-[-0.02em] text-hearth-espresso dark:text-hearth-night-ink"
          >
            {esRestaurante ? 'Tu cuenta es de restaurante' : 'Entra para pedir'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className={`af-pulsar -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hearth-oat text-hearth-pebble transition-colors hover:text-hearth-espresso dark:bg-hearth-night-oat dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink ${FOCO}`}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
        {esRestaurante
          ? 'El carrito es para comensales. Si quieres pedir, entra con una cuenta de cliente.'
          : 'Tu carrito y tus pedidos se guardan en tu cuenta. Explorar es libre; pedir necesita una.'}
      </p>

      {esRestaurante ? (
        <div className="mt-6">
          <button type="button" onClick={onCambiarCuenta} className={BOTON_PRIMARIO}>
            Cambiar de cuenta
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          <Link to={`/entrar?volver=${destino}`} className={BOTON_PRIMARIO}>
            Entrar
          </Link>
          <Link to={`/entrar?modo=registro&volver=${destino}`} className={BOTON_SUAVE}>
            Crear una cuenta
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={onCerrar}
        className={`mt-3 w-full py-2 text-[13px] font-bold text-hearth-pebble transition-colors hover:text-hearth-espresso dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink ${FOCO}`}
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
      <div>
        <p className={`${ETIQUETA} text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink`}>
          Un pedido, un restaurante
        </p>
        <h2
          id="titulo-aviso-restaurante"
          className="mt-1 font-jakarta text-xl font-extrabold leading-snug tracking-[-0.02em] text-hearth-espresso dark:text-hearth-night-ink"
        >
          Tu carrito es de {actual ?? 'otro restaurante'}
        </h2>
      </div>
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar"
        className={`af-pulsar -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hearth-oat text-hearth-pebble transition-colors hover:text-hearth-espresso dark:bg-hearth-night-oat dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink ${FOCO}`}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>

    <p className="mt-3 text-[13.5px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
      Al agregar este plato de {nuevo} empezarás un carrito nuevo. El anterior se vacía.
    </p>

    <div className="mt-6 flex flex-col gap-2">
      <button type="button" onClick={onConfirmar} className={BOTON_PRIMARIO}>
        Empezar de nuevo
      </button>
      <button type="button" onClick={onCerrar} className={BOTON_SUAVE}>
        Cancelar
      </button>
    </div>
  </Hoja>
);
