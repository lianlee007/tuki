import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { FormularioDatosEnvio } from './FormularioDatosEnvio';
import { formatearDireccionEnvio, type DatosEnvio, type EstadoDatosEnvio } from '../../modulos/cuenta';

interface Props {
  estado: EstadoDatosEnvio;
}

/**
 * Pestaña «Datos de envío» de Mi cuenta.
 *
 * Si la cuenta ya tiene teléfono, dirección y barrio, muestra el resumen y deja
 * editarlo. Si no, abre el formulario directamente: es la vía para completar
 * lo que se omitió durante el registro.
 */
export const SeccionDatosEnvio: React.FC<Props> = ({ estado }) => {
  const { datos, cargando, error, completo, guardar, recargar } = estado;
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  useEffect(() => {
    if (cargando) return;
    setEditando(!completo);
  }, [cargando, completo]);

  const alGuardar = async (entrada: DatosEnvio) => {
    setErrorGuardado(null);
    setGuardando(true);
    try {
      const fallo = await guardar(entrada);
      if (fallo) {
        setErrorGuardado(fallo);
        return;
      }
      setGuardado(true);
      setEditando(false);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="animate-pulse rounded-3xl bg-af-surface p-6 sm:p-8">
        <div className="h-4 w-32 rounded bg-af-ink/10" />
        <div className="mt-3 h-6 w-64 max-w-full rounded bg-af-ink/10" />
        <div className="mt-6 h-24 rounded-2xl bg-af-ink/5" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-3xl border border-af-danger/20 bg-af-surface p-6 sm:p-8"
      >
        <p className="text-sm font-semibold text-af-ink">
          No pudimos cargar tus datos de envío.
        </p>
        <p className="mt-1 text-sm text-af-ink-secondary">
          Revisa tu conexión e inténtalo otra vez.
        </p>
        <button
          type="button"
          onClick={recargar}
          className="af-pulsar mt-4 inline-flex items-center gap-2 rounded-xl border border-af-ink/15 px-4 py-2.5 text-sm font-semibold text-af-ink transition-colors hover:border-af-ink/30"
        >
          <RefreshCw size={15} /> Reintentar
        </button>
      </div>
    );
  }

  if (completo && datos && !editando) {
    return (
      <div className="space-y-4">
        {guardado && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-2xl border border-af-success/25 bg-af-success/10 px-4 py-3 text-sm font-medium text-af-success"
          >
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
            Datos guardados. Los usaremos en tu próximo pedido.
          </p>
        )}

        <div className="rounded-3xl bg-af-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <span className="rounded-2xl bg-af-accent/10 p-3 text-af-accent-text">
                <MapPin size={22} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-af-ink-secondary">
                  Datos de envío
                </p>
                <p className="mt-1 text-lg font-semibold leading-snug text-af-ink">
                  {formatearDireccionEnvio(datos)}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-af-ink-secondary">
                  <Phone size={14} aria-hidden="true" />
                  {datos.telefono}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setGuardado(false);
                setEditando(true);
              }}
              className="af-pulsar inline-flex items-center gap-2 rounded-xl border border-af-ink/15 px-4 py-2.5 text-sm font-semibold text-af-ink transition-colors hover:border-af-ink/30"
            >
              <Pencil size={14} /> Editar
            </button>
          </div>

          <p className="mt-5 flex items-start gap-2 rounded-xl bg-af-ground px-3.5 py-3 text-xs leading-relaxed text-af-ink-secondary">
            <ShieldCheck
              size={14}
              className="mt-0.5 shrink-0 text-af-success"
              aria-hidden="true"
            />
            Solo lo ve el restaurante que recibe tu pedido. Tu correo nunca se
            muestra junto a la dirección.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-af-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-af-ink-secondary">
            Datos de envío
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-af-ink sm:text-2xl">
            {completo ? 'Actualiza tus datos de entrega' : '¿Dónde te llevamos el pedido?'}
          </h2>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-af-ink-secondary">
            Guárdalos una vez y los usaremos para llenar tus pedidos. Puedes
            cambiarlos cuando quieras.
          </p>
        </div>

        {completo && (
          <button
            type="button"
            onClick={() => {
              setErrorGuardado(null);
              setEditando(false);
            }}
            className="af-pulsar rounded-xl px-3 py-2 text-sm font-semibold text-af-ink-secondary transition-colors hover:text-af-ink"
          >
            Cancelar
          </button>
        )}
      </div>

      <div className="mt-5">
        <FormularioDatosEnvio
          inicial={datos}
          guardando={guardando}
          error={errorGuardado}
          textoBoton={completo ? 'Guardar cambios' : 'Guardar datos de envío'}
          onGuardar={alGuardar}
        />
      </div>
    </div>
  );
};
