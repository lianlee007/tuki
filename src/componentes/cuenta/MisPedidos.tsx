import React, { useCallback, useEffect, useState } from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  ReceiptText,
  RefreshCw,
  Truck,
  XCircle,
} from 'lucide-react';
import { ImagenInteligente } from '../sistema-diseno/ImagenInteligente';
import { apiPedidos } from '../../api/apiPedidos';
import {
  codigoPedido,
  dinero,
  esEstadoPedido,
  esPedidoActivo,
  etiquetaEstado,
  fechaPedido,
  resumenItems,
  unidadesPedido,
  type EstadoPedido,
  type Pedido,
} from '../../lib/pedidos';
import { generarSlugUnico } from '../../lib/utils';

interface Props {
  usuarioId: string;
}

const ESTILO: Record<EstadoPedido, string> = {
  pendiente: 'bg-af-accent/10 text-af-accent-text',
  confirmado: 'bg-af-success/15 text-af-success',
  en_camino: 'bg-af-success/15 text-af-success',
  entregado: 'bg-af-ink/10 text-af-ink-secondary',
  cancelado: 'bg-af-danger/10 text-af-danger-text',
};

const ICONO: Record<EstadoPedido, React.ReactNode> = {
  pendiente: <Clock size={13} />,
  confirmado: <CheckCircle2 size={13} />,
  en_camino: <Truck size={13} />,
  entregado: <CheckCircle2 size={13} />,
  cancelado: <XCircle size={13} />,
};

const CTA_BOTON =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-af-ink px-4 py-2.5 text-sm font-semibold text-af-ground transition-opacity hover:opacity-90 af-pulsar';

/**
 * Pedidos del comensal.
 *
 * El pedido nace en WhatsApp; esta copia sirve para recordar qué se pidió, en
 * qué va y volver al menú del restaurante. Los pedidos anteriores a la fase B
 * solo existen en el chat: el estado vacío lo dice sin prometer un historial
 * que no está.
 */
export const MisPedidos: React.FC<Props> = ({ usuarioId }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { pedidos: encontrados, error: fallo } = await apiPedidos.mios(usuarioId);
      if (fallo) throw fallo;
      setPedidos(encontrados);
    } catch {
      setError('No pudimos cargar tus pedidos. Inténtalo otra vez.');
      setPedidos([]);
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const activos = pedidos.filter(esPedidoActivo);
  const cerrados = pedidos.filter((pedido) => !esPedidoActivo(pedido));

  if (cargando) {
    return (
      <div className="space-y-3" aria-hidden="true">
        {[1, 2].map((item) => (
          <div key={item} className="rounded-[20px] bg-af-surface p-5">
            <span className="block h-3 w-32 rounded-full bg-af-ground" />
            <span className="mt-4 block h-3 w-2/3 rounded-full bg-af-ground" />
          </div>
        ))}
      </div>
    );
  }

  if (error && pedidos.length === 0) {
    return (
      <div className="rounded-2xl bg-af-surface px-6 py-10 text-center">
        <p className="text-base font-semibold text-af-ink">{error}</p>
        <button type="button" onClick={cargar} className={`mt-4 ${CTA_BOTON}`}>
          <RefreshCw size={16} /> Reintentar
        </button>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="rounded-2xl bg-af-surface px-6 py-12 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-af-ground text-af-ink-secondary">
          <ReceiptText size={22} />
        </span>
        <p className="mt-3 text-base font-semibold text-af-ink">
          Aún no tienes pedidos guardados
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-af-ink-secondary">
          Desde ahora, cada pedido que hagas con tu cuenta queda aquí para que
          lo consultes. Los anteriores viven en tu chat de WhatsApp.
        </p>
        <Link to="/" className={`mt-5 ${CTA_BOTON}`}>
          Buscar qué comer
        </Link>
      </div>
    );
  }

  const tarjeta = (pedido: Pedido) => {
    const estado: EstadoPedido = esEstadoPedido(pedido.estado)
      ? pedido.estado
      : 'pendiente';
    const restaurante = pedido.restaurante;
    const enlace = restaurante
      ? `/restaurante/${generarSlugUnico(restaurante.nombre, restaurante.id)}`
      : '/';

    return (
      <li key={pedido.id} className="rounded-[20px] bg-af-surface p-5">
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-af-ground text-sm font-bold text-af-ink-secondary">
            {restaurante?.imagen_logo_url ? (
              <ImagenInteligente
                src={restaurante.imagen_logo_url}
                alt=""
                className="h-full w-full"
              />
            ) : (
              (restaurante?.nombre?.charAt(0) ?? 'R').toUpperCase()
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-af-ink">
              {restaurante?.nombre ?? 'Restaurante'}
            </p>
            <p className="mt-0.5 text-xs text-af-ink-secondary">
              {codigoPedido(pedido.id)} · {fechaPedido(pedido.created_at) || 'Hace poco'}
            </p>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${ESTILO[estado]}`}
          >
            {ICONO[estado]}
            {etiquetaEstado(estado)}
          </span>
        </div>

        <p className="mt-3 rounded-xl bg-af-ground px-3 py-2 text-xs leading-relaxed text-af-ink-secondary">
          {resumenItems(pedido.items, 4)}
        </p>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 text-xs text-af-ink-secondary">
            <p className="font-semibold text-af-ink">{dinero(pedido.total)}</p>
            <p className="mt-0.5">
              {unidadesPedido(pedido.items)} unidad
              {unidadesPedido(pedido.items) === 1 ? '' : 'es'}
            </p>
            {pedido.direccion_entrega && (
              <p className="mt-1 inline-flex items-start gap-1">
                <MapPin size={12} className="mt-0.5" /> {pedido.direccion_entrega}
              </p>
            )}
          </div>

          <Link
            to={enlace}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-af-ink-secondary transition-colors hover:bg-af-ink/5 hover:text-af-ink af-pulsar"
          >
            <ExternalLink size={14} /> Ver el menú
          </Link>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="text-sm font-medium text-af-danger-text">
          {error}
        </p>
      )}

      {activos.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-af-ink-secondary">
            En curso
          </h3>
          <ul className="space-y-3">{activos.map(tarjeta)}</ul>
        </section>
      )}

      {cerrados.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-af-ink-secondary">
            Historial
          </h3>
          <ul className="space-y-3">{cerrados.map(tarjeta)}</ul>
        </section>
      )}
    </div>
  );
};
