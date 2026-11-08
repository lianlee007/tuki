import { useEffect, useState } from 'react';
import type { Pedido } from '@tuki/dominio';
import { mensajeDeError } from '@tuki/api-cliente';
import { usarAuth } from '@tuki/auth-react';
import { Cabecera, Cargando, MensajeError, Tarjeta } from '@tuki/ui-kit';
import { apis } from '../apis';

const ETIQUETA: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const MisPedidos = () => {
  const { usuario, salir } = usarAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apis.pedidos
      .mios()
      .then((respuesta) => setPedidos(respuesta.pedidos))
      .catch((fallo) => setError(mensajeDeError(fallo)))
      .finally(() => setCargando(false));
  }, []);

  return (
    <>
      <Cabecera>
        <span>{usuario?.nombre}</span>
        <button className="tuki-btn tuki-btn-secundario" onClick={() => void salir()}>
          Salir
        </button>
      </Cabecera>
      <main className="tuki-main">
        <h1 className="tuki-titulo">Mis pedidos</h1>
        <p className="tuki-subtitulo">Historial de tus pedidos por WhatsApp.</p>

        {cargando ? <Cargando /> : null}
        {error ? <MensajeError>{error}</MensajeError> : null}

        <div className="tuki-grid">
          {pedidos.map((pedido) => (
            <Tarjeta key={pedido.id}>
              <div className="tuki-fila">
                <strong>#{pedido.id.slice(0, 8)}</strong>
                <span className="tuki-chip">{ETIQUETA[pedido.estado] ?? pedido.estado}</span>
              </div>
              <p>{pedido.items.map((item) => `${item.cantidad}x ${item.nombre}`).join(', ')}</p>
              <div className="tuki-fila">
                <small>{new Date(pedido.creadoEn).toLocaleString('es-CO')}</small>
                <span className="tuki-precio">
                  ${pedido.total.toLocaleString('es-CO')}
                </span>
              </div>
            </Tarjeta>
          ))}
        </div>

        {!cargando && pedidos.length === 0 ? <p>Todavía no tienes pedidos.</p> : null}
      </main>
    </>
  );
};
