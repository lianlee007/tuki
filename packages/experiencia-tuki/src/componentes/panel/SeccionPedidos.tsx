import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  ReceiptText,
  RefreshCw,
  Truck,
  XCircle,
  ChefHat,
  Wallet,
} from 'lucide-react';
import {
  apiPedidos,
  codigoPedido,
  dinero,
  esEstadoPedido,
  esPedidoActivo,
  etiquetaEstado,
  fechaPedido,
  resumenItems,
  siguienteEstado,
  unidadesPedido,
  type EstadoPedido,
  type Pedido,
} from '../../modulos/pedidos';
import type { Restaurante } from '../../tipos/modelos';

type Filtro = 'activos' | 'pendientes' | 'cerrados' | 'todos';

interface Props {
  restaurante: Restaurante;
  mostrarMensaje: (tipo: 'exito' | 'error', texto: string) => void;
}

const ESTILO_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'bg-af-accent/10 text-af-accent-text',
  confirmado: 'bg-af-success/15 text-af-success',
  en_camino: 'bg-af-success/15 text-af-success',
  entregado: 'bg-af-ink/10 text-af-ink-secondary',
  cancelado: 'bg-af-danger/10 text-af-danger-text',
};

const ICONO_ESTADO: Record<EstadoPedido, React.ReactNode> = {
  pendiente: <Clock size={13} />,
  confirmado: <CheckCircle2 size={13} />,
  en_camino: <Truck size={13} />,
  entregado: <CheckCircle2 size={13} />,
  cancelado: <XCircle size={13} />,
};

/** Texto del botón que lleva al estado siguiente, en imperativo. */
const ACCION_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'Confirmar',
  confirmado: 'Confirmar',
  en_camino: 'Marcar en camino',
  entregado: 'Marcar entregado',
  cancelado: 'Cancelar',
};

const numeroWhatsApp = (telefono: string | null | undefined): string => {
  const limpio = (telefono ?? '').replace(/\D/g, '');
  if (!limpio) return '';
  return limpio.startsWith('57') && limpio.length > 10 ? limpio : `57${limpio}`;
};

/**
 * Bandeja de pedidos del restaurante.
 *
 * El pedido sigue llegando por WhatsApp; aquí queda la copia que el dueño
 * puede seguir sin buscar el chat: quién pidió, qué pidió y en qué va. Solo el
 * estado se mueve desde el panel: los importes y el contacto no se editan.
 */
export const SeccionPedidos: React.FC<Props> = ({ restaurante, mostrarMensaje }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('activos');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cambiandoId, setCambiandoId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { pedidos: encontrados, error: fallo } = await apiPedidos.delRestaurante(
        restaurante.id
      );
      if (fallo) throw fallo;
      setPedidos(encontrados);
    } catch {
      setError('No pudimos cargar los pedidos. Inténtalo otra vez.');
      setPedidos([]);
    } finally {
      setCargando(false);
    }
  }, [restaurante.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const pendientes = useMemo(
    () => pedidos.filter((pedido) => pedido.estado === 'pendiente'),
    [pedidos]
  );
  const activos = useMemo(() => pedidos.filter(esPedidoActivo), [pedidos]);
  const cerrados = useMemo(
    () => pedidos.filter((pedido) => !esPedidoActivo(pedido)),
    [pedidos]
  );
  const ventasDeHoy = useMemo(() => {
    const hoy = new Date().toDateString();
    return pedidos
      .filter(
        (pedido) =>
          pedido.estado !== 'cancelado' &&
          pedido.created_at &&
          new Date(pedido.created_at).toDateString() === hoy
      )
      .reduce((suma, pedido) => suma + Number(pedido.total || 0), 0);
  }, [pedidos]);

  const visibles =
    filtro === 'activos'
      ? activos
      : filtro === 'pendientes'
        ? pendientes
        : filtro === 'cerrados'
          ? cerrados
          : pedidos;

  const cambiarEstado = async (pedido: Pedido, estado: EstadoPedido) => {
    const anteriores = pedidos;
    setCambiandoId(pedido.id);
    setPedidos((prev) =>
      prev.map((item) => (item.id === pedido.id ? { ...item, estado } : item))
    );

    try {
      const { error: fallo } = await apiPedidos.cambiarEstado(pedido.id, estado);
      if (fallo) throw fallo;
      mostrarMensaje('exito', `Pedido ${codigoPedido(pedido.id)}: ${etiquetaEstado(estado)}`);
    } catch {
      setPedidos(anteriores);
      mostrarMensaje('error', 'No pudimos cambiar el estado del pedido.');
    } finally {
      setCambiandoId(null);
    }
  };

  const tabs: { id: Filtro; texto: string; cantidad: number }[] = [
    { id: 'activos', texto: 'En curso', cantidad: activos.length },
    { id: 'pendientes', texto: 'Por confirmar', cantidad: pendientes.length },
    { id: 'cerrados', texto: 'Cerrados', cantidad: cerrados.length },
    { id: 'todos', texto: 'Todos', cantidad: pedidos.length },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={cargar}
          className="af-pulsar inline-flex items-center gap-2 rounded-xl border border-af/15 bg-af-surface px-3.5 py-2 text-xs font-semibold text-af-ink-secondary transition-colors hover:text-af-ink"
        >
          <RefreshCw size={15} aria-hidden="true" />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-2xl border border-af/10 bg-af-surface p-3 sm:p-5">
          <div className="flex items-center justify-between gap-1">
            <p className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-af-ink-secondary sm:text-xs">
              Por confirmar
            </p>
            <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-af-accent/10 text-af-accent-text sm:flex">
              <Clock size={15} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-af-ink sm:mt-2 sm:text-2xl">
            {pendientes.length}
          </p>
        </div>
        <div className="rounded-2xl border border-af/10 bg-af-surface p-3 sm:p-5">
          <div className="flex items-center justify-between gap-1">
            <p className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-af-ink-secondary sm:text-xs">
              En curso
            </p>
            <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-af-accent/10 text-af-accent-text sm:flex">
              <ChefHat size={15} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-af-ink sm:mt-2 sm:text-2xl">
            {activos.length}
          </p>
        </div>
        <div className="rounded-2xl border border-af/10 bg-af-surface p-3 sm:p-5">
          <div className="flex items-center justify-between gap-1">
            <p className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-af-ink-secondary sm:text-xs">
              Ventas de hoy
            </p>
            <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-af-success/10 text-af-success sm:flex">
              <Wallet size={15} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-af-ink sm:mt-2 sm:text-2xl">
            {dinero(ventasDeHoy)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar pedidos">
        {tabs.map((tab) => {
          const activa = filtro === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltro(tab.id)}
              aria-pressed={activa}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors af-pulsar ${
                activa
                  ? 'bg-af-ink text-af-ground'
                  : 'bg-af-surface text-af-ink-secondary hover:text-af-ink'
              }`}
            >
              {tab.texto}{' '}
              <span className="tabular-nums opacity-70">({tab.cantidad})</span>
            </button>
          );
        })}
      </div>

      {cargando ? (
        <div className="space-y-3" aria-hidden="true">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-[20px] bg-af-surface p-5">
              <span className="block h-3 w-40 rounded-full bg-af-ground" />
              <span className="mt-4 block h-3 w-2/3 rounded-full bg-af-ground" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-af-surface px-6 py-10 text-center">
          <p className="text-base font-semibold text-af-ink">{error}</p>
          <button
            type="button"
            onClick={cargar}
            className="mt-4 rounded-xl bg-af-ink px-4 py-2.5 text-sm font-semibold text-af-ground af-pulsar"
          >
            Reintentar
          </button>
        </div>
      ) : visibles.length === 0 ? (
        <div className="rounded-2xl bg-af-surface px-6 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-af-ground text-af-ink-secondary">
            <ReceiptText size={22} />
          </span>
          <p className="mt-3 text-base font-semibold text-af-ink">
            {filtro === 'pendientes'
              ? 'No hay pedidos por confirmar'
              : filtro === 'cerrados'
                ? 'Todavía no hay pedidos cerrados'
                : 'Aún no hay pedidos guardados'}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-af-ink-secondary">
            Cuando un cliente con cuenta pida desde tu menú, el pedido aparecerá
            aquí además de llegar a tu WhatsApp.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visibles.map((pedido) => {
            const estado: EstadoPedido = esEstadoPedido(pedido.estado)
              ? pedido.estado
              : 'pendiente';
            const siguiente = siguienteEstado(pedido.estado);
            const procesando = cambiandoId === pedido.id;
            const wa = numeroWhatsApp(pedido.telefono_cliente);

            return (
              <li key={pedido.id} className="rounded-[20px] bg-af-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-af-ground px-2 py-0.5 text-[11px] font-bold tabular-nums text-af-ink-secondary">
                        {codigoPedido(pedido.id)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${ESTILO_ESTADO[estado]}`}
                      >
                        {ICONO_ESTADO[estado]}
                        {etiquetaEstado(estado)}
                      </span>
                      <span className="text-xs text-af-ink-secondary">
                        {fechaPedido(pedido.created_at) || 'Hace poco'}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-af-ink">
                      {pedido.nombre_cliente}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-af-ink-secondary">
                      {pedido.telefono_cliente && (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={12} /> {pedido.telefono_cliente}
                        </span>
                      )}
                      {pedido.direccion_entrega && (
                        <span className="inline-flex items-start gap-1">
                          <MapPin size={12} className="mt-0.5" />
                          {pedido.direccion_entrega}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-af-ink">
                      {dinero(pedido.total)}
                    </p>
                    <p className="text-[11px] text-af-ink-secondary">
                      {unidadesPedido(pedido.items)} unidad
                      {unidadesPedido(pedido.items) === 1 ? '' : 'es'}
                    </p>
                  </div>
                </div>

                <p className="mt-3 rounded-xl bg-af-ground px-3 py-2 text-xs leading-relaxed text-af-ink-secondary">
                  {resumenItems(pedido.items, 4)}
                </p>

                {pedido.notas_cliente && (
                  <p className="mt-2 text-xs leading-relaxed text-af-ink-secondary">
                    <span className="font-semibold text-af-ink">Nota del cliente:</span>{' '}
                    {pedido.notas_cliente}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-af/15 pt-4">
                  {wa && (
                    <a
                      href={`https://wa.me/${wa}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-af-ink-secondary transition-colors hover:bg-af-ink/5 hover:text-af-ink af-pulsar"
                    >
                      <MessageCircle size={14} /> Escribir al cliente
                    </a>
                  )}

                  {esPedidoActivo(pedido) && (
                    <button
                      type="button"
                      onClick={() => cambiarEstado(pedido, 'cancelado')}
                      disabled={procesando}
                      className="rounded-xl px-3 py-2 text-xs font-semibold text-af-danger-text transition-colors hover:bg-af-danger/10 disabled:opacity-50 af-pulsar"
                    >
                      Cancelar
                    </button>
                  )}

                  {siguiente && (
                    <button
                      type="button"
                      onClick={() => cambiarEstado(pedido, siguiente)}
                      disabled={procesando}
                      className="inline-flex items-center gap-2 rounded-xl bg-af-accent-solid px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 af-pulsar"
                    >
                      {ICONO_ESTADO[siguiente]}
                      {procesando ? 'Guardando…' : ACCION_ESTADO[siguiente]}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
